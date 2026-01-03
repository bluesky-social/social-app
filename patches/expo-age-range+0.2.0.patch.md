With the current `expo-age-range`, we get the following error when trying to run
`yarn ios`:

```
❌  (/Users/estrattonbailey/Sites/bsky/app/node_modules/expo-age-range/ios/AgeRangeModule.swift:14:62)

  12 |       }
  13 | 
> 14 |       let currentVc: UIViewController? = await MainActor.run { [appContext] in
     |                                                              ^ task or actor isolated value cannot be sent
  15 |         appContext?.utilities?.currentViewController()
  16 |       }
  17 |
```

It seems there's a concurrency issue with accessing `appContext` from within a
`MainActor.run` block. Expo team has said that this is only a warning in their
env, but for some reason it errors out for us.

Since the code uses optional chaining, and there's a guard for a missing
`currentVc` right after, we can just capture `appContext` in a local variable
before the `MainActor.run` block to avoid the concurrency issue.

We will track this and remove the patch when Expo releases a fix or we figure
out why our environment is erroring out.
