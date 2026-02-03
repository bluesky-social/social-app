# DM Image Moderation System

This module provides a pluggable, extensible architecture for moderating images in Direct Messages.

## Design Philosophy

**Separation of Concerns:**
- **Client-Side Privacy**: User preferences for personal control (current)
- **Platform Moderation**: Backend policies for abuse prevention (future)

These serve different needs and can coexist. User preferences give immediate control while AT Protocol designs the "permissioned data" infrastructure for platform-level moderation.

## Architecture

The system uses a priority-based pipeline:

```
1. Backend Moderation (highest priority - future)
   ↓
2. Custom Policies (extensible)
   ↓
3. User Preferences (current)
   ↓
4. No Blur (default)
```

## Current Implementation

### User Preferences
- **Always Blur**: Blur all DM images
- **Blur From Non-Follows**: Blur images from accounts not followed

Settings: `Messages Settings > Image Privacy`

## Future Integration

### Adding Backend Moderation

When AT Protocol adds moderation support:

```typescript
// 1. Protocol adds moderation field
interface MessageView {
  moderation?: ModerationUI
}

// 2. In parent component, call moderation function
const modui = moderateMessage(message, moderationOpts)

// 3. Pass to DMImageContentHider
<DMImageContentHider
  message={message}
  convo={convo}
  moderation={modui}  // ← Automatically takes priority
>
  {children}
</DMImageContentHider>
```

**No component changes needed** - the pipeline automatically prioritizes backend moderation.

### Adding Custom Policies

Create policies that match your needs:

```typescript
import {ModerationPolicy} from './moderation/types'

const myCustomPolicy: ModerationPolicy = {
  name: 'my-policy',
  priority: 5,  // Lower = higher priority
  evaluate: (context) => {
    // Your logic here
    if (shouldBlur) {
      return {
        shouldBlur: true,
        source: 'user-preference',
        modui: createModerationUI(),
        reason: 'custom-rule',
      }
    }
    return null  // Pass to next policy
  },
}

// Use it
<DMImageContentHider
  message={message}
  convo={convo}
  customPolicies={[myCustomPolicy]}
>
  {children}
</DMImageContentHider>
```

See `example-policies.ts` for more examples.

### Adding Analytics

Track moderation decisions:

```typescript
<DMImageContentHider
  message={message}
  convo={convo}
  onModerationDecision={(decision) => {
    analytics.track('dm_image_moderation', {
      source: decision.source,
      reason: decision.reason,
      shouldBlur: decision.shouldBlur,
    })
  }}
>
  {children}
</DMImageContentHider>
```

## Extension Points

### For Product Team

1. **Regional Policies**: Different content standards per region
2. **A/B Testing**: Test new moderation approaches
3. **ML Integration**: Machine learning-based content detection
4. **Reputation System**: Blur based on sender trust scores
5. **Reporting Integration**: Connect to abuse reporting pipeline

### For Protocol Team

1. **Moderation Field**: Add `MessageView.moderation?: ModerationUI`
2. **Moderation Function**: Implement `moderateMessage(message, opts)`
3. **Label Definitions**: Define DM-specific content labels
4. **Policy Config**: Server-driven policy configuration

## File Structure

```
moderation/
├── README.md                 # This file
├── index.ts                  # Public exports
├── types.ts                  # Type definitions
├── useModerationDecision.ts  # Decision pipeline hook
└── example-policies.ts       # Policy examples
```

## Testing

See `__tests__/components/dms/DMImageContentHider.test.tsx` for comprehensive test coverage including:
- User preference logic
- Priority system verification
- Edge case handling
- Backend moderation integration

## Principles

1. **Extensible**: Easy to add new policies without modifying core code
2. **Predictable**: Clear priority system and decision flow
3. **Testable**: Isolated decision logic for comprehensive testing
4. **Future-Proof**: Designed for backend integration without breaking changes
5. **Respectful**: Acknowledges moderation is complex, not trivial
