/* eslint-disable bsky-internal/avoid-unwrapped-text */
import {ChatBskyGroupDefs} from '@atproto/api'

import {Img} from './Img.js'

export const CHAT_INVITE_HEIGHT = 630
export const CHAT_INVITE_WIDTH = 1200

const PADDING = 64

export function ChatInvite({
  preview,
  ownerImage,
}: {
  preview: ChatBskyGroupDefs.JoinLinkPreviewView
  ownerImage: Buffer<ArrayBufferLike> | null
}) {
  return (
    <div
      style={{
        width: CHAT_INVITE_WIDTH,
        height: CHAT_INVITE_HEIGHT,
        display: 'flex',
        position: 'relative',
        backgroundColor: '#006AFF',
      }}>
      <Background
        style={{
          position: 'absolute',
          inset: 0,
        }}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: PADDING,
          color: 'white',
          fontFamily: 'Inter',
        }}>
        {/* Avatar */}
        <div
          style={{
            display: 'flex',
            width: 160,
            height: 160,
            borderRadius: '50%',
            overflow: 'hidden',
          }}>
          {ownerImage && <Img src={ownerImage} width="100%" height="100%" />}
        </div>

        {/* Spacer pushes the text block to the bottom-left */}
        <div style={{display: 'flex', flex: 1}} />

        {/* Group Chat row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 26,
            fontWeight: 600,
            lineHeight: 1.3,
          }}>
          <ChatIcon style={{marginRight: 8, marginTop: -2}} />
          Group Chat
        </div>

        {/* Chat name */}
        <div
          style={{
            display: 'block',
            fontSize: 80,
            fontWeight: 700,
            lineHeight: 1.1,
            marginTop: 6,
            minHeight: 130,
            maxWidth: 1000,
            wordBreak: 'break-word',
            lineClamp: 2,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
          }}>
          {preview.name}
        </div>

        {/* By @handle */}
        <div
          style={{
            display: 'block',
            fontSize: 34,
            fontWeight: 400,
            marginTop: 12,
            lineHeight: 1.3,
            lineClamp: 1,
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            maxWidth: 800,
            wordBreak: 'break-all',
          }}>
          {'By @' + preview.owner.handle}
        </div>
      </div>
    </div>
  )
}

function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <path
        d="M9.99935 14.3334C10.9198 14.3334 11.666 15.0796 11.666 16.0001C11.666 16.9206 10.9198 17.6667 9.99935 17.6667C9.07887 17.6667 8.33268 16.9206 8.33268 16.0001C8.33268 15.0796 9.07887 14.3334 9.99935 14.3334Z"
        fill="white"
      />
      <path
        d="M15.9993 14.3334C16.9198 14.3334 17.666 15.0796 17.666 16.0001C17.666 16.9206 16.9198 17.6667 15.9993 17.6667C15.0789 17.6667 14.3327 16.9206 14.3327 16.0001C14.3327 15.0796 15.0789 14.3334 15.9993 14.3334Z"
        fill="white"
      />
      <path
        d="M21.9993 14.3334C22.9198 14.3334 23.666 15.0796 23.666 16.0001C23.666 16.9206 22.9198 17.6667 21.9993 17.6667C21.0789 17.6667 20.3327 16.9206 20.3327 16.0001C20.3327 15.0796 21.0789 14.3334 21.9993 14.3334Z"
        fill="white"
      />
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M15.9993 2.66675C23.3631 2.66675 29.3327 8.63628 29.3327 16.0001C29.3327 23.3639 23.3631 29.3334 15.9993 29.3334C14.0352 29.3334 12.167 28.9082 10.485 28.1433L4.24414 29.3113C3.80802 29.3927 3.35993 29.2513 3.04883 28.935C2.73759 28.6183 2.60409 28.1668 2.69336 27.7319L3.93424 21.6824C3.12049 19.9572 2.66602 18.0301 2.66602 16.0001C2.66602 8.63629 8.63556 2.66676 15.9993 2.66675ZM15.9993 5.33341C10.1083 5.33343 5.33268 10.1091 5.33268 16.0001C5.33268 17.7656 5.76102 19.4272 6.51758 20.8907C6.65753 21.1615 6.69993 21.4723 6.63867 21.7709L5.70378 26.3243L10.4212 25.4415C10.7058 25.3883 11.0005 25.4298 11.2598 25.5587C12.6861 26.2674 14.2941 26.6667 15.9993 26.6667C21.8904 26.6667 26.666 21.8911 26.666 16.0001C26.666 10.109 21.8904 5.33341 15.9993 5.33341Z"
        fill="white"
      />
    </svg>
  )
}

function Background(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="1200"
      height="630"
      viewBox="0 0 1200 630"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <g clip-path="url(#clip0_3134_11977)">
        <path
          d="M938.799 522.018C944.511 526.47 950.654 535.496 952.91 540.34C955.166 535.496 961.309 526.47 967.021 522.018C971.142 518.806 977.82 516.32 977.82 524.229C977.82 525.808 976.948 537.498 976.436 539.396C974.658 545.993 968.178 547.676 962.413 546.657C972.489 548.438 975.053 554.335 969.517 560.232C957.062 573.5 952.91 553.134 952.91 553.134C952.91 553.134 948.758 573.5 936.303 560.232C930.768 554.335 933.331 548.438 943.407 546.657C937.642 547.676 931.162 545.993 929.384 539.396C928.872 537.498 928 525.808 928 524.229C928 516.32 934.678 518.806 938.799 522.018Z"
          fill="white"
        />
        <path
          d="M1008.88 541.392C1012.31 542.653 1014.13 545.565 1014.13 548.825C1014.13 554.346 1010.53 557.693 1003.63 557.693H989.527V526.743H1003.16C1009.73 526.743 1012.9 530.177 1012.9 534.742C1012.9 537.784 1011.55 540.001 1008.88 541.392ZM1002.74 531.568H995.244V539.653H1002.74C1005.66 539.653 1007.23 538.089 1007.23 535.48C1007.23 533.09 1005.62 531.568 1002.74 531.568ZM995.244 552.824H1003.33C1006.55 552.824 1008.29 551.303 1008.29 548.564C1008.29 545.695 1006.64 544.261 1003.33 544.261H995.244V552.824Z"
          fill="white"
        />
        <path
          d="M1022.06 557.693H1016.72V526.743H1022.06V557.693Z"
          fill="white"
        />
        <path
          d="M1039.75 547.825V535.263H1045.09V557.693H1039.92V554.432C1038.27 556.954 1035.98 558.214 1033.06 558.214C1028.44 558.214 1025.44 555.345 1025.44 550.129V535.263H1030.77V549.216C1030.77 552.042 1032.13 553.476 1034.88 553.476C1037.46 553.476 1039.75 551.52 1039.75 547.825Z"
          fill="white"
        />
        <path
          d="M1069.37 546.869V548.173H1053.03C1053.41 552.042 1055.48 553.954 1058.7 553.954C1061.16 553.954 1062.81 552.868 1063.7 550.738H1068.82C1067.68 555.302 1063.87 558.214 1058.66 558.214C1055.4 558.214 1052.77 557.127 1050.78 554.998C1048.79 552.868 1047.78 550.042 1047.78 546.478C1047.78 542.957 1048.75 540.132 1050.74 537.958C1052.73 535.828 1055.31 534.742 1058.57 534.742C1061.88 534.742 1064.5 535.872 1066.45 538.089C1068.4 540.305 1069.37 543.261 1069.37 546.869ZM1058.53 539.001C1055.61 539.001 1053.58 540.74 1053.07 544.348H1064.04C1063.57 541.088 1061.62 539.001 1058.53 539.001Z"
          fill="white"
        />
        <path
          d="M1081.2 558.301C1074.85 558.301 1071.5 555.737 1071.2 550.564H1076.41C1076.71 553.346 1078.06 554.389 1081.28 554.389C1084.16 554.389 1085.6 553.476 1085.6 551.694C1085.6 550.086 1084.59 549.303 1081.33 548.738L1078.83 548.303C1074.04 547.478 1071.67 545.217 1071.67 541.522C1071.67 537.306 1074.93 534.742 1080.73 534.742C1086.96 534.742 1090.18 537.263 1090.39 542.348H1085.35C1085.22 539.61 1083.65 538.654 1080.73 538.654C1078.19 538.654 1076.92 539.523 1076.92 541.262C1076.92 542.827 1078.02 543.522 1080.56 544L1083.32 544.435C1088.61 545.435 1090.9 547.434 1090.9 551.259C1090.9 555.78 1087.34 558.301 1081.2 558.301Z"
          fill="white"
        />
        <path
          d="M1114.31 557.693H1108.22L1101.86 547.26L1098.56 550.651V557.693H1093.31V526.743H1098.56V544.565L1107.45 535.263H1113.81L1105.55 543.739L1114.31 557.693Z"
          fill="white"
        />
        <path
          d="M1128.25 540.914L1130.03 535.263H1135.62L1127.19 559.518C1126.3 561.996 1125.2 563.778 1123.8 564.778C1122.41 565.778 1120.42 566.256 1117.79 566.256C1116.9 566.256 1116.14 566.212 1115.46 566.125V561.822H1117.49C1119.91 561.822 1121.09 560.301 1121.09 558.214C1121.09 557.171 1120.75 555.65 1120.08 553.694L1113.72 535.263H1119.48L1121.26 540.87C1122.58 545.087 1123.72 549.26 1124.74 553.389C1125.67 549.825 1126.85 545.652 1128.25 540.914Z"
          fill="white"
        />
        <g filter="url(#filter0_d_3134_11977)">
          <rect
            x="236"
            y="130"
            width="145.6"
            height="145.6"
            rx="72.8"
            fill="#4291FF"
            shape-rendering="crispEdges"
          />
          <path
            d="M308.006 202.8C321.082 202.8 331.09 210.636 335.154 221.624C336.316 224.765 335.52 227.861 333.674 230.062C331.874 232.207 329.095 233.512 326.102 233.512H289.909C286.916 233.512 284.138 232.206 282.339 230.062C280.492 227.861 279.696 224.765 280.858 221.624C284.922 210.636 294.929 202.8 308.006 202.8ZM308.001 168.675C316.482 168.675 323.357 175.551 323.357 184.032C323.357 192.513 316.482 199.387 308.001 199.387C299.52 199.387 292.644 192.513 292.644 184.032C292.644 175.551 299.52 168.675 308.001 168.675Z"
            fill="#006AFF"
          />
        </g>
        <g filter="url(#filter1_d_3134_11977)">
          <rect
            x="316"
            y="-60"
            width="191.1"
            height="191.1"
            rx="95.55"
            fill="#4291FF"
            shape-rendering="crispEdges"
          />
          <path
            d="M412.006 35.5498C429.441 35.55 442.784 45.9985 448.202 60.6484C449.751 64.8366 448.691 68.9642 446.229 71.8984C443.829 74.7581 440.125 76.4999 436.135 76.5H387.876C383.886 76.5 380.182 74.7581 377.783 71.8984C375.32 68.9642 374.26 64.8366 375.809 60.6484C381.227 45.9983 394.571 35.5498 412.006 35.5498ZM411.999 -9.9502C423.307 -9.95 432.474 -0.782514 432.474 10.5254C432.474 21.8332 423.307 30.9998 411.999 31C400.691 31 391.524 21.8333 391.524 10.5254C391.524 -0.782633 400.691 -9.9502 411.999 -9.9502Z"
            fill="#006AFF"
          />
        </g>
        <g filter="url(#filter2_d_3134_11977)">
          <rect
            x="472"
            y="84"
            width="246"
            height="246"
            rx="123"
            fill="#4291FF"
            shape-rendering="crispEdges"
          />
          <path
            d="M596.01 207C618.454 207.001 635.631 220.449 642.606 239.308C644.6 244.7 643.235 250.014 640.065 253.792C636.976 257.472 632.207 259.714 627.071 259.714H564.949C559.812 259.714 555.044 257.473 551.955 253.792C548.785 250.014 547.42 244.7 549.414 239.308C556.388 220.449 573.566 207 596.01 207ZM596.002 148.428C610.558 148.428 622.359 160.229 622.359 174.786C622.359 189.342 610.558 201.143 596.002 201.143C581.445 201.143 569.644 189.342 569.644 174.786C569.644 160.229 581.445 148.428 596.002 148.428Z"
            fill="#006AFF"
          />
        </g>
        <g filter="url(#filter3_d_3134_11977)">
          <rect
            x="870"
            y="-22"
            width="308.195"
            height="308.195"
            rx="154.098"
            fill="#4291FF"
            shape-rendering="crispEdges"
          />
          <path
            d="M1024.01 132.098C1052.13 132.098 1073.65 148.948 1082.39 172.574C1084.89 179.329 1083.18 185.987 1079.21 190.719C1075.34 195.331 1069.36 198.14 1062.93 198.14H985.098C978.663 198.14 972.689 195.331 968.819 190.719C964.848 185.987 963.138 179.329 965.636 172.574C974.374 148.947 995.894 132.098 1024.01 132.098ZM1024 58.7178C1042.24 58.7178 1057.02 73.5023 1057.02 91.7393C1057.02 109.976 1042.24 124.76 1024 124.76C1005.76 124.76 990.981 109.976 990.981 91.7393C990.981 73.5024 1005.76 58.7179 1024 58.7178Z"
            fill="#006AFF"
          />
        </g>
        <g filter="url(#filter4_d_3134_11977)">
          <rect
            x="546"
            y="-290"
            width="374"
            height="374"
            rx="187"
            fill="#4291FF"
            shape-rendering="crispEdges"
          />
        </g>
        <g filter="url(#filter5_d_3134_11977)">
          <rect
            x="728"
            y="222"
            width="180"
            height="180"
            rx="90"
            fill="#4291FF"
            shape-rendering="crispEdges"
          />
          <path
            d="M818.006 312C834.429 312 846.998 321.841 852.101 335.64C853.56 339.585 852.561 343.473 850.242 346.237C847.981 348.931 844.492 350.571 840.734 350.571H795.278C791.519 350.571 788.03 348.931 785.77 346.237C783.451 343.473 782.453 339.585 783.912 335.64C789.015 321.841 801.584 312 818.006 312ZM817.999 269.143C828.651 269.143 837.286 277.778 837.286 288.429C837.285 299.08 828.651 307.714 817.999 307.714C807.348 307.714 798.714 299.08 798.714 288.429C798.714 277.778 807.348 269.143 817.999 269.143Z"
            fill="#006AFF"
          />
        </g>
        <g filter="url(#filter6_d_3134_11977)">
          <rect
            x="1146"
            y="220"
            width="178"
            height="178"
            rx="89"
            fill="#4291FF"
            shape-rendering="crispEdges"
          />
        </g>
      </g>
      <defs>
        <filter
          id="filter0_d_3134_11977"
          x="204"
          y="114"
          width="209.6"
          height="209.6"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="16" />
          <feGaussianBlur stdDeviation="16" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_3134_11977"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_3134_11977"
            result="shape"
          />
        </filter>
        <filter
          id="filter1_d_3134_11977"
          x="284"
          y="-76"
          width="255.1"
          height="255.1"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="16" />
          <feGaussianBlur stdDeviation="16" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_3134_11977"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_3134_11977"
            result="shape"
          />
        </filter>
        <filter
          id="filter2_d_3134_11977"
          x="440"
          y="68"
          width="310"
          height="310"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="16" />
          <feGaussianBlur stdDeviation="16" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_3134_11977"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_3134_11977"
            result="shape"
          />
        </filter>
        <filter
          id="filter3_d_3134_11977"
          x="838"
          y="-38"
          width="372.195"
          height="372.195"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="16" />
          <feGaussianBlur stdDeviation="16" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_3134_11977"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_3134_11977"
            result="shape"
          />
        </filter>
        <filter
          id="filter4_d_3134_11977"
          x="514"
          y="-306"
          width="438"
          height="438"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="16" />
          <feGaussianBlur stdDeviation="16" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_3134_11977"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_3134_11977"
            result="shape"
          />
        </filter>
        <filter
          id="filter5_d_3134_11977"
          x="696"
          y="206"
          width="244"
          height="244"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="16" />
          <feGaussianBlur stdDeviation="16" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_3134_11977"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_3134_11977"
            result="shape"
          />
        </filter>
        <filter
          id="filter6_d_3134_11977"
          x="1114"
          y="204"
          width="242"
          height="242"
          filterUnits="userSpaceOnUse"
          color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="16" />
          <feGaussianBlur stdDeviation="16" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_3134_11977"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_3134_11977"
            result="shape"
          />
        </filter>
        <clipPath id="clip0_3134_11977">
          <rect width="1200" height="630" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
