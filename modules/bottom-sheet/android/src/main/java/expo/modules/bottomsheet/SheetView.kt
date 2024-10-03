package expo.modules.bottomsheet

import android.util.Log
import android.view.View
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.scrollable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.SheetValue
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.composables.core.BottomSheet
import com.composables.core.SheetDetent
import com.composables.core.SheetDetent.Companion.FullyExpanded
import com.composables.core.SheetDetent.Companion.Hidden
import com.composables.core.rememberBottomSheetState
import kotlinx.coroutines.launch
import kotlin.annotations.jvm.Mutable

data class SheetState(
  var isOpen: Boolean = false,
  var cornerRadius: Float? = null,
  var containerBackgroundColor: Int? = null,
  var preventExpansion: Boolean = false,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SheetView(
  state: MutableState<SheetState>,
  openState: MutableState<Boolean>,
  innerView: View,
  contentHeight: Float,
  onDismissRequest: () -> Unit,
  onExpanded: () -> Unit,
  onHidden: () -> Unit,
) {
  val Peek = SheetDetent(identifier = "peek") { containerHeight, sheetHeight ->
    containerHeight*0.6f
  }

  val scope = rememberCoroutineScope()

  val sheetState = rememberBottomSheetState(
    initialDetent = Hidden,
    detents = listOf(Hidden, Peek, FullyExpanded)
  )

  BottomSheet(
    state = sheetState,
    modifier = Modifier.fillMaxWidth()
      .shadow(4.dp)
      .clip(RoundedCornerShape(topStart = state.value.cornerRadius ?: 0f, topEnd = state.value.cornerRadius ?: 0f))
      .background(Color(state.value.containerBackgroundColor ?: android.graphics.Color.TRANSPARENT))
      .imePadding()
//    onDismissRequest = onDismissRequest,
//    shape =
//      RoundedCornerShape(
//        topStart = state.value.cornerRadius ?: 0f,
//        topEnd = state.value.cornerRadius ?: 0f,
//      ),
//    containerColor = Color(state.value.containerBackgroundColor ?: android.graphics.Color.TRANSPARENT),
  ) {
    AndroidView(
      factory = { innerView },
    )
  }

  LaunchedEffect(openState) {
    Log.d("SheetView", "openState: ${openState.value}")
    if (openState.value) {
      sheetState.currentDetent = Peek
    } else {
      sheetState.currentDetent = Hidden
    }
  }

  LaunchedEffect(sheetState.currentDetent) {
    if (sheetState.currentDetent == Peek || sheetState.currentDetent == FullyExpanded) {
      onExpanded()
    } else if (sheetState.currentDetent == Hidden) {
      onHidden()
    }
  }
}
