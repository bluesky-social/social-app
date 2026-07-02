package expo.modules.blueskyvideocompress

import android.opengl.GLES11Ext
import android.opengl.GLES20
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer

class TextureRenderer {
  companion object {
    private const val FLOAT_SIZE_BYTES = 4
    private const val STRIDE_BYTES = 5 * FLOAT_SIZE_BYTES
    private const val POS_OFFSET = 0
    private const val UV_OFFSET = 3

    private val VERTICES = floatArrayOf(
      -1.0f, -1.0f, 0f, 0f, 0f,
       1.0f, -1.0f, 0f, 1f, 0f,
      -1.0f,  1.0f, 0f, 0f, 1f,
       1.0f,  1.0f, 0f, 1f, 1f,
    )

    private const val VERTEX_SHADER = """
      uniform mat4 uMVPMatrix;
      uniform mat4 uSTMatrix;
      attribute vec4 aPosition;
      attribute vec4 aTextureCoord;
      varying vec2 vTextureCoord;
      void main() {
        gl_Position = uMVPMatrix * aPosition;
        vTextureCoord = (uSTMatrix * aTextureCoord).xy;
      }
    """

    private const val FRAGMENT_SHADER = """
      #extension GL_OES_EGL_image_external : require
      precision mediump float;
      varying vec2 vTextureCoord;
      uniform samplerExternalOES sTexture;
      void main() {
        gl_FragColor = texture2D(sTexture, vTextureCoord);
      }
    """
  }

  private val vertices: FloatBuffer =
    ByteBuffer.allocateDirect(VERTICES.size * FLOAT_SIZE_BYTES)
      .order(ByteOrder.nativeOrder())
      .asFloatBuffer()
      .apply { put(VERTICES); position(0) }

  private val mvpMatrix = FloatArray(16)
  private var program = 0
  private var textureId = -1
  private var uMVPMatrixHandle = 0
  private var uSTMatrixHandle = 0
  private var aPositionHandle = 0
  private var aTextureCoordHandle = 0

  init {
    Matrix.setIdentityM(mvpMatrix, 0)
  }

  fun getTextureId(): Int = textureId

  fun surfaceCreated() {
    program = createProgram(VERTEX_SHADER, FRAGMENT_SHADER)

    aPositionHandle = GLES20.glGetAttribLocation(program, "aPosition")
    aTextureCoordHandle = GLES20.glGetAttribLocation(program, "aTextureCoord")
    uMVPMatrixHandle = GLES20.glGetUniformLocation(program, "uMVPMatrix")
    uSTMatrixHandle = GLES20.glGetUniformLocation(program, "uSTMatrix")

    val textures = IntArray(1)
    GLES20.glGenTextures(1, textures, 0)
    textureId = textures[0]

    GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, textureId)
    GLES20.glTexParameterf(
      GLES11Ext.GL_TEXTURE_EXTERNAL_OES,
      GLES20.GL_TEXTURE_MIN_FILTER, GLES20.GL_LINEAR.toFloat()
    )
    GLES20.glTexParameterf(
      GLES11Ext.GL_TEXTURE_EXTERNAL_OES,
      GLES20.GL_TEXTURE_MAG_FILTER, GLES20.GL_LINEAR.toFloat()
    )
    GLES20.glTexParameteri(
      GLES11Ext.GL_TEXTURE_EXTERNAL_OES,
      GLES20.GL_TEXTURE_WRAP_S, GLES20.GL_CLAMP_TO_EDGE
    )
    GLES20.glTexParameteri(
      GLES11Ext.GL_TEXTURE_EXTERNAL_OES,
      GLES20.GL_TEXTURE_WRAP_T, GLES20.GL_CLAMP_TO_EDGE
    )
  }

  fun drawFrame(stMatrix: FloatArray) {
    GLES20.glClearColor(0f, 0f, 0f, 1f)
    GLES20.glClear(GLES20.GL_DEPTH_BUFFER_BIT or GLES20.GL_COLOR_BUFFER_BIT)

    GLES20.glUseProgram(program)
    GLES20.glActiveTexture(GLES20.GL_TEXTURE0)
    GLES20.glBindTexture(GLES11Ext.GL_TEXTURE_EXTERNAL_OES, textureId)

    vertices.position(POS_OFFSET)
    GLES20.glVertexAttribPointer(
      aPositionHandle, 3, GLES20.GL_FLOAT, false, STRIDE_BYTES, vertices
    )
    GLES20.glEnableVertexAttribArray(aPositionHandle)

    vertices.position(UV_OFFSET)
    GLES20.glVertexAttribPointer(
      aTextureCoordHandle, 2, GLES20.GL_FLOAT, false, STRIDE_BYTES, vertices
    )
    GLES20.glEnableVertexAttribArray(aTextureCoordHandle)

    GLES20.glUniformMatrix4fv(uMVPMatrixHandle, 1, false, mvpMatrix, 0)
    GLES20.glUniformMatrix4fv(uSTMatrixHandle, 1, false, stMatrix, 0)

    GLES20.glDrawArrays(GLES20.GL_TRIANGLE_STRIP, 0, 4)
    GLES20.glDisableVertexAttribArray(aPositionHandle)
    GLES20.glDisableVertexAttribArray(aTextureCoordHandle)
  }

  private fun createProgram(vertexSource: String, fragmentSource: String): Int {
    val vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, vertexSource)
    val fragmentShader = loadShader(GLES20.GL_FRAGMENT_SHADER, fragmentSource)
    val program = GLES20.glCreateProgram()
    GLES20.glAttachShader(program, vertexShader)
    GLES20.glAttachShader(program, fragmentShader)
    GLES20.glLinkProgram(program)
    val linkStatus = IntArray(1)
    GLES20.glGetProgramiv(program, GLES20.GL_LINK_STATUS, linkStatus, 0)
    if (linkStatus[0] != GLES20.GL_TRUE) {
      val log = GLES20.glGetProgramInfoLog(program)
      GLES20.glDeleteProgram(program)
      throw RuntimeException("Could not link program: $log")
    }
    return program
  }

  private fun loadShader(type: Int, source: String): Int {
    val shader = GLES20.glCreateShader(type)
    GLES20.glShaderSource(shader, source)
    GLES20.glCompileShader(shader)
    val compiled = IntArray(1)
    GLES20.glGetShaderiv(shader, GLES20.GL_COMPILE_STATUS, compiled, 0)
    if (compiled[0] == 0) {
      val log = GLES20.glGetShaderInfoLog(shader)
      GLES20.glDeleteShader(shader)
      throw RuntimeException("Could not compile shader $type: $log")
    }
    return shader
  }
}
