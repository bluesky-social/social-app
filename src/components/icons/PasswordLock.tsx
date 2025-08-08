import Svg, {Path, type SvgProps} from 'react-native-svg'

export const PasswordLock = (props: SvgProps) => (
  <Svg width={49} height={48} fill="none" {...props}>
    <Path
      stroke="#C30B0D"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M13.5 16.929a.786.786 0 0 1 0-1.572M13.5 16.929a.786.786 0 0 0 0-1.572M29.214 16.929a.786.786 0 0 1 0-1.572M29.214 16.929a.786.786 0 0 0 0-1.572M21.357 16.929a.786.786 0 1 1 0-1.572M21.357 16.929a.786.786 0 1 0 0-1.572M31.571 30.286v-3.929a5.5 5.5 0 0 1 11 0v3.929"
    />
    <Path
      stroke="#C30B0D"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M29.214 39.714v-7.857c0-.868.704-1.571 1.572-1.571h12.571c.868 0 1.572.703 1.572 1.571v7.857c0 .868-.704 1.572-1.572 1.572H30.786a1.572 1.572 0 0 1-1.572-1.572ZM38.643 14.277v-4.42A3.143 3.143 0 0 0 35.5 6.714H7.214a3.143 3.143 0 0 0-3.143 3.143V22.43a3.143 3.143 0 0 0 3.143 3.142h17.679"
    />
  </Svg>
)
