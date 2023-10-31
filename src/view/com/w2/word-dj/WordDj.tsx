import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import {AddBlockButton} from './AddBlockButton'
import {BlockList} from './BlockList'
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
import {observer} from 'mobx-react-lite'
import {InsertionPoint, WordDJMode} from 'state/models/w2/WordDJModel'
import {usePalette} from 'lib/hooks/usePalette'
import {Pointer} from 'lib/hooks/waverly/useMovingBlocksPointer'
import {Placeholder} from './Placeholder'
import {Block} from './Block'
import {s} from 'lib/styles'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
//import {clamp} from 'lib/numbers'
import {Toolbar} from './Toolbar'
import {ToolDrawer} from './drawer/ToolDrawer'
import {IdeaPicker} from './drawer/IdeaPicker'
import {IdeasModel} from 'state/models/w2/IdeasModel'
import {useStores} from 'state/index'
import {BlockManipulatorModel} from 'state/models/w2/BlockManipulatorModel'
import {BlockManipulator} from './drawer/BlockManipulator'
import {useTheme} from 'lib/ThemeContext'
import {GroupItem} from '../../modals/waverly/group-search/GroupItem'
import * as Toast from '../../util/Toast'
import {GroupSearchItem} from 'w2-api/waverly_sdk'
import {fabStyleRound} from '../universal-fab-style'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps} from '@react-navigation/native-stack'
import {CommonNavigatorParams} from 'lib/routes/types'
import {WaverlyScreenPadding} from '../WaverlyScreenPadding'
import {ViewHeader} from 'view/com/util/ViewHeader'
import {withAuthRequired} from 'view/com/auth/withAuthRequired'
import {ModePicker} from './top-bar/ModePicker'
import {TextButton} from './top-bar/ButtonGroup'

const ANIM_DURATION = 150

// Account for the toolbar at the bottom
const MINIMUM_BOTTOM_MARGIN = 150
const MINIMUM_BOTTOM_MARGIN_WITH_KEYBOARD = 60
const EXTRA_DRAWER_MARGIN = 20

type DrawerMode = 'closed' | 'ideas' | 'blockManipulator'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'WordDJScreen'>
export const WordDJScreen = withAuthRequired(
  observer(function WordDJScreen({}: Props) {
    const theme = useTheme()
    const store = useStores()
    const pal = usePalette('primary')
    const safeAreaInsets = useSafeAreaInsets()
    const model = store.wordDJModel

    const onClose: () => void = useCallback(() => {}, [])

    const [pointer, setPointer] = useState<Pointer | undefined>()

    const [ideasModel, setIdeasModel] = useState<IdeasModel | undefined>()

    const [blockManipulatorModel, setBlockManipulatorModel] = useState<
      BlockManipulatorModel | undefined
    >()

    const [drawerMode, setDrawerMode] = useState<DrawerMode>('closed')
    const [drawerHeight, setDrawerHeight] = useState(0)

    const [scrollContainerHeight, setScrollContainerHeight] = useState(0)
    const insertionPoint = useRef<InsertionPoint | undefined>()

    // WordDJ disables the global FAB; it has its own with custom behaviours.
    useFocusEffect(
      useCallback(() => {
        const cleanup = () => {
          store.shell.showFab()
        }
        store.shell.setMinimalShellMode(true)
        store.shell.hideFab()
        return cleanup
      }, [store.shell]),
    )

    useEffect(() => {
      if (drawerMode === 'closed') setDrawerHeight(0)
    }, [drawerMode])

    const visibleScrollHeight = useMemo(
      () =>
        Math.max(
          0,
          scrollContainerHeight -
            Math.max(
              drawerHeight + EXTRA_DRAWER_MARGIN,
              model.currentMode === 'word-dj'
                ? MINIMUM_BOTTOM_MARGIN
                : MINIMUM_BOTTOM_MARGIN_WITH_KEYBOARD,
            ),
        ),
      [drawerHeight, model.currentMode, scrollContainerHeight],
    )

    // Recognized modes are 'word-dj' and 'manual'.
    // noops in the case of unrecognized input.
    const onSetCurrentMode = useCallback(
      (newMode: WordDJMode) => {
        let bModeChanged = false
        if (newMode === 'word-dj') bModeChanged = model.setMode('word-dj')
        else if (newMode === 'manual') bModeChanged = model.setMode('manual')

        if (bModeChanged) {
          setDrawerMode('closed')
          model.updateAuthoritativeStateForMode()

          // We're going into manual mode, therefore close any open block drawer
          if (blockManipulatorModel && newMode === 'manual') {
            blockManipulatorModel.cancel
            setBlockManipulatorModel(undefined)
          }
        }
      },
      [model, blockManipulatorModel],
    )

    // Drive the model state whenever keypresses occur in the TextInput UI field.
    const onChangeText = useCallback(
      (newText: string) => {
        model.setManualPayload(newText)
      },
      [model],
    )

    const onNext = useCallback(() => {
      model
        .savePost()
        .then(r => {
          if (r.postMiniBlog) {
            store.me.waverlyFeed.addPostToTop(r.postMiniBlog.uri).then(() => {
              Toast.show('Successfully created post.')
              // TODO: Instead of refresh find a way to auto scroll to top
              store.me.waverlyFeed.refresh()
              onClose && onClose()
            })
          }
        })
        .catch(e => {
          console.error(`Error creating miniblog: ${e}`)
          Toast.show('Oh no! Something went wrong.')
        })
    }, [model, onClose, store.me.waverlyFeed])

    const moveStart = useCallback(
      (key: React.Key) => {
        model.unselectAll()
        model.setIsMoving(key, true)
      },
      [model],
    )

    const moveEnd = useCallback(
      (key: React.Key) => {
        model.moveBlock(key, insertionPoint.current)
        insertionPoint.current = undefined
      },
      [model],
    )

    /////////////////////////////////////////////////////////////////////////////
    // Run when the '+' button is dragged over the list of blocks.
    const onCreate = useCallback(() => {
      model.showPlaceholder(insertionPoint.current)
      setIdeasModel(new IdeasModel(store, model))
    }, [model, store])

    /////////////////////////////////////////////////////////////////////////////
    // Run whenever a user selects or unselects a block.
    const onSelectBlock = useCallback(
      (key: React.Key) => {
        const isSelected = model.isBlockSelected(key)
        if (isSelected) {
          model.unselectBlock(key)
          if (drawerMode === 'blockManipulator' && blockManipulatorModel) {
            blockManipulatorModel.cancel
          }
        } else {
          model.selectBlock(key)
          const text = model.getBlockText(key)
          if (!text) throw new Error('Invalid text for selected block')
          setBlockManipulatorModel(
            new BlockManipulatorModel(store, text, model),
          )
        }
      },
      [model, store, blockManipulatorModel, drawerMode],
    )

    /////////////////////////////////////////////////////////////////////////////
    // Run when the 'Remove' action is selected from the Block Drawer.
    const onRemoveBlock = useCallback(() => {
      const key = model.selectedBlock?.key
      if (!key) throw new Error('Removing block without selection')
      model.removeBlock(key)
    }, [model])

    /////////////////////////////////////////////////////////////////////////////
    // Run when the 'Split' action is selected from the Block Drawer
    const onSplit = useCallback(
      (part1: string, part2: string) => {
        const key = model.selectedBlock?.key
        if (!key) throw new Error('Splitting block without selection')
        model.createBlock(part1, {key, type: 'before'})
        model.setBlockText(key, part2)
      },
      [model],
    )

    /////////////////////////////////////////////////////////////////////////////
    // Run whenever a user selects or unselects a block.
    // Intent is to act when blocks are all fully deselected.
    useEffect(() => {
      if (!model.hasSelection && blockManipulatorModel)
        blockManipulatorModel.cancel()
    }, [blockManipulatorModel, model.hasSelection])

    /////////////////////////////////////////////////////////////////////////////
    // Run to capture ideasModel state changes.
    useEffect(() => {
      if (!ideasModel) return
      //console.log('IdeasModel state now ', ideasModel.state)
      switch (ideasModel.state) {
        case 'uninitialized':
          ideasModel.loadIdeas(model.fullText)
          break
        case 'loading':
          model.updateSystemMessageFromBlocks()
          setDrawerMode('ideas')
          break
        case 'idle':
          break
        case 'generating':
          setDrawerMode('closed')
          model.setPlaceholderLoading()
          break
        case 'generated':
          const newText = ideasModel.generatedIdea
          if (newText) {
            const newBlockKey = model.createBlock(
              newText,
              insertionPoint.current,
            )

            // Now select the block.
            model.selectBlock(newBlockKey)
            setBlockManipulatorModel(
              new BlockManipulatorModel(store, newText, model),
            )
          }
          model.hidePlaceholder()
          insertionPoint.current = undefined
          break
        case 'canceled':
          setDrawerMode('closed')
          model.hidePlaceholder()
          insertionPoint.current = undefined
          break
      }
    }, [ideasModel, ideasModel?.state, model, store])

    /////////////////////////////////////////////////////////////////////////////
    // Run to capture blockManipulatorModel state changes.
    useEffect(() => {
      if (!blockManipulatorModel) return
      //console.log('blockManipulatorModel state now ', blockManipulatorModel.state)
      switch (blockManipulatorModel.state) {
        case 'uninitialized':
          blockManipulatorModel.analyzeText()
          break
        case 'analyzing':
          model.updateSystemMessageFromBlocks()
          setDrawerMode('blockManipulator')
          break
        case 'idle':
          const selectedBlock = model.selectedBlock
          if (selectedBlock)
            model.setBlockText(selectedBlock.key, blockManipulatorModel.text)
          break
        case 'generating':
          blockManipulatorModel.hideCustomTextBox()
          break
        case 'canceled':
          setDrawerMode('closed')
          model.unselectAll()
          break
      }
    }, [blockManipulatorModel, blockManipulatorModel?.state, model])

    const onGroupSelectedCallback = useCallback(
      (g: GroupSearchItem) => {
        model.setGroup(g)
      },
      [model],
    )

    const onGroupSelectorPress = useCallback(() => {
      store.shell.openModal({
        name: 'group-selector',
        onSelect: onGroupSelectedCallback,
      })
    }, [onGroupSelectedCallback, store.shell])

    // Disable UI while we're generating/saving/loading something.
    const bIsDisabledState = useMemo<boolean | undefined>(() => {
      return (
        model.state === 'saving' ||
        (ideasModel && !['canceled', 'generated'].includes(ideasModel.state)) ||
        (blockManipulatorModel && blockManipulatorModel.state === 'generating')
      )
    }, [blockManipulatorModel, ideasModel, model.state])

    const isSaveButtonDisabled = useMemo<boolean>(() => {
      // The Save button is disabled when we're generating something, or when
      // the post isn't yet ready for saving (e.g. no post content, no tgt Wave)
      return bIsDisabledState || !model.canSavePost
    }, [bIsDisabledState, model.canSavePost])

    const renderNextOrDoneButton = useCallback(
      () => (
        <HeaderButton
          disabled={isSaveButtonDisabled}
          onNext={drawerMode === 'closed' ? onNext : undefined}
          onDone={
            drawerMode === 'blockManipulator' && blockManipulatorModel
              ? blockManipulatorModel.cancel
              : undefined
          }
        />
      ),
      [blockManipulatorModel, drawerMode, isSaveButtonDisabled, onNext],
    )

    const addBlockDisabled = bIsDisabledState || model.currentMode !== 'word-dj'
    return (
      <WaverlyScreenPadding>
        <View style={s.flex1}>
          <View style={s.flex1}>
            <ViewHeader
              showOnDesktop
              renderButton={renderNextOrDoneButton}
              renderTitle={() => (
                <ModePicker
                  disabled={bIsDisabledState}
                  onSetCurrentMode={onSetCurrentMode} // TODO: safe this to various drawerModes, async states, etc
                />
              )}
            />
            <TouchableOpacity
              accessibilityRole="button"
              style={[s.p10, s.flexRow, s.alignCenter, s.g5, s.pb20]}
              onPress={onGroupSelectorPress}>
              <GroupItem group={model.group} emptyPlaceholder="Select Wave" />
              <FontAwesomeIcon
                icon="angle-down"
                size={16}
                style={pal.text as FontAwesomeIconStyle}
              />
            </TouchableOpacity>
            <KeyboardAvoidingView
              style={s.flex1}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View
                style={styles.mainContainer}
                onLayout={e =>
                  setScrollContainerHeight(e.nativeEvent.layout?.height ?? 0)
                }>
                {model.currentMode === 'word-dj' && (
                  <BlockList
                    style={[styles.contentContainer]}
                    pointer={pointer}
                    setPointer={setPointer}
                    insertionPoint={insertionPoint}
                    onPress={onSelectBlock}
                    moveStart={moveStart}
                    moveEnd={moveEnd}
                    placeholderType={Placeholder}
                    animDuration={ANIM_DURATION}
                    visibleScrollHeight={visibleScrollHeight}
                    disabled={bIsDisabledState}>
                    {model.blocks.map(block => {
                      if (block.type === 'standard') {
                        return (
                          <Block
                            key={block.key}
                            state={block.state}
                            text={block.text}
                          />
                        )
                      } else {
                        return (
                          <Placeholder
                            key={block.key}
                            forBlock={false}
                            loading={block.state === 'loading'}
                          />
                        )
                      }
                    })}
                  </BlockList>
                )}
                {model.currentMode === 'manual' && (
                  <View style={[styles.contentContainer]}>
                    <TextInput
                      style={[
                        theme.typography.lg,
                        pal.text,
                        styles.textContainer,
                        {maxHeight: visibleScrollHeight},
                      ]}
                      multiline
                      onChangeText={onChangeText}
                      value={model.manualPayload}
                      autoFocus={true}
                      accessible={true}
                      accessibilityLabel="al"
                      accessibilityHint={`ah`}
                    />
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
            <Toolbar
              visible={true}
              //blur={true}
              onUndo={model.undo}
              onRedo={model.redo}
            />
          </View>
          <AddBlockButton
            onCreate={onCreate}
            onPointerMoved={setPointer}
            style={[
              fabStyleRound,
              {bottom: safeAreaInsets.bottom}, //clamp(safeAreaInsets.bottom, 15, 30) + 6},
              addBlockDisabled ? pal.viewInvertedLight : pal.viewInverted,
            ]}
            animDuration={ANIM_DURATION}
            disabled={addBlockDisabled}>
            <FontAwesomeIcon
              icon="plus"
              size={24}
              style={pal.textInverted as FontAwesomeIconStyle}
            />
          </AddBlockButton>
          {ideasModel && (
            <ToolDrawer
              visible={drawerMode === 'ideas'}
              onHeightChanged={setDrawerHeight}>
              <IdeaPicker
                model={ideasModel}
                allBlocksText={model.allBlocksText()}
                nonQuotesBlocksText={model.nonQuotesBlocksText()}
                hideLength={true}
                hideTone={false}
                showOptionsDuringCustomText={false}
              />
            </ToolDrawer>
          )}
          {blockManipulatorModel && (
            <ToolDrawer
              visible={drawerMode === 'blockManipulator'}
              onHeightChanged={setDrawerHeight}>
              <BlockManipulator
                onRemoveBlock={onRemoveBlock}
                onSplit={onSplit}
                model={blockManipulatorModel}
              />
            </ToolDrawer>
          )}
        </View>
      </WaverlyScreenPadding>
    )
  }),
)

interface HeaderButtonProps {
  disabled?: boolean
  onNext?: () => void
  onDone?: () => void
}
const HeaderButton = ({disabled, onNext, onDone}: HeaderButtonProps) => {
  return (
    <View style={styles.headerButtonsContainer}>
      {onNext && (
        <TextButton
          emphasis={!onDone}
          text="Next"
          disabled={disabled}
          onPress={onNext}
        />
      )}
      {onDone && (
        <TextButton emphasis text="Done" disabled={disabled} onPress={onDone} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  textContainer: {
    borderRadius: 16,
    margin: 2,
    padding: 8,
    backgroundColor: '#cde1ff', // Pale blue matching the manual toggle state.
  },
  mainContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  contentContainer: {
    marginHorizontal: 10,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
