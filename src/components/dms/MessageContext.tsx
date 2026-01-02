import React from 'react'

const MessageContext = React.createContext(false)
MessageContext.displayName = 'MessageContext'

export function MessageContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MessageContext.Provider value={true}>{children}</MessageContext.Provider>
  )
}

export function useIsWithinMessage() {
  return React.useContext(MessageContext)
}
