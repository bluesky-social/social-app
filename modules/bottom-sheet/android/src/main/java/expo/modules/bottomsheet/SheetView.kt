package expo.modules.bottomsheet

import android.view.View
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetValue
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView

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
  innerView: View,
  contentHeight: Float,
  onDismissRequest: () -> Unit,
  onExpanded: () -> Unit,
  onHidden: () -> Unit,
) {
  val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = false)

  ModalBottomSheet(
    sheetState = sheetState,
    onDismissRequest = onDismissRequest,
    shape =
      RoundedCornerShape(
        topStart = state.value.cornerRadius ?: 0f,
        topEnd = state.value.cornerRadius ?: 0f,
      ),
    containerColor = Color(state.value.containerBackgroundColor ?: android.graphics.Color.TRANSPARENT),
  ) {
    Column(
      Modifier
        .fillMaxWidth()
        .height(contentHeight.dp)
        // Prevent covering up the handle
        .padding(top = 34.dp),
    ) {
      AndroidView(
        factory = { innerView },
      )
    }
  }

  LaunchedEffect(sheetState.currentValue) {
    if (sheetState.currentValue == SheetValue.PartiallyExpanded || sheetState.currentValue == SheetValue.Expanded) {
      onExpanded()
    } else if (sheetState.currentValue == SheetValue.Hidden) {
      onHidden()
    }
  }
}
