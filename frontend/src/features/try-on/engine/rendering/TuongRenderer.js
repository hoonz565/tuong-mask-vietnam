const VIDEO_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_uv;
out vec2 v_uv;
void main() {
  v_uv = a_uv;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const VIDEO_FRAGMENT_SHADER = `#version 300 es
precision mediump float;
uniform sampler2D u_video;
uniform vec2 u_crop;
uniform bool u_mirror;
in vec2 v_uv;
out vec4 outColor;
void main() {
  vec2 uv = (v_uv - 0.5) * u_crop + 0.5;
  if (u_mirror) uv.x = 1.0 - uv.x;
  outColor = texture(u_video, uv);
}`;

const MASK_VERTEX_SHADER = `#version 300 es
in vec2 a_position;
in vec2 a_uv;
in vec2 a_parse_uv;
in float a_visibility;
out vec2 v_uv;
out vec2 v_parse_uv;
out float v_visibility;
void main() {
  v_uv = a_uv;
  v_parse_uv = a_parse_uv;
  v_visibility = a_visibility;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const MASK_FRAGMENT_SHADER = `#version 300 es
precision mediump float;
uniform sampler2D u_atlas;
uniform sampler2D u_parse;
uniform bool u_has_parse;
uniform float u_alpha;
uniform float u_intensity;
in vec2 v_uv;
in vec2 v_parse_uv;
in float v_visibility;
out vec4 outColor;
void main() {
  vec4 paint = texture(u_atlas, v_uv);
  float semanticAlpha = 1.0;
  if (u_has_parse) {
    if (any(lessThan(v_parse_uv, vec2(0.0))) || any(greaterThan(v_parse_uv, vec2(1.0)))) {
      semanticAlpha = 0.0;
    } else {
      semanticAlpha = texture(u_parse, v_parse_uv).r;
    }
  }
  float alpha = paint.a * semanticAlpha * u_alpha * u_intensity * v_visibility;
  outColor = vec4(paint.rgb, alpha);
}`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`WebGL shader compile failed: ${message}`);
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`WebGL program link failed: ${message}`);
  }
  return program;
}

function createTexture(gl, filter = gl.LINEAR) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

export function poseOpacity(pose, limits) {
  if (!pose || !limits) return 1;
  const yawRatio = Math.abs(pose.yaw) / Math.max(1, limits.yaw);
  const pitchRatio = Math.abs(pose.pitch) / Math.max(1, limits.pitch);
  const worst = Math.max(yawRatio, pitchRatio);
  if (worst <= 0.85) return 1;
  if (worst >= 1.2) return 0;
  return 1 - (worst - 0.85) / 0.35;
}

export function calculateCoverTransform(videoWidth, videoHeight, canvasWidth, canvasHeight) {
  const videoAspect = videoWidth / Math.max(1, videoHeight);
  const canvasAspect = canvasWidth / Math.max(1, canvasHeight);
  if (videoAspect > canvasAspect) {
    return { cropX: canvasAspect / videoAspect, cropY: 1 };
  }
  return { cropX: 1, cropY: videoAspect / canvasAspect };
}

export function landmarkToClip(landmark, cover, mirror) {
  const displayX = (landmark.x - 0.5) / cover.cropX + 0.5;
  const displayY = (landmark.y - 0.5) / cover.cropY + 0.5;
  return {
    x: (mirror ? 1 - displayX : displayX) * 2 - 1,
    y: 1 - displayY * 2,
  };
}

export function createReprojectedParseUvs(mesh, sourceLandmarks, roi) {
  if (!mesh || !sourceLandmarks || !roi || roi.width <= 0 || roi.height <= 0) return null;
  const parseUvs = new Float32Array(mesh.vertexIndices.length * 2);
  for (let index = 0; index < mesh.vertexIndices.length; index += 1) {
    const landmark = sourceLandmarks[mesh.vertexIndices[index]];
    if (!landmark) return null;
    parseUvs[index * 2] = (landmark.x - roi.x) / roi.width;
    parseUvs[index * 2 + 1] = (landmark.y - roi.y) / roi.height;
  }
  return parseUvs;
}

function signedTriangleArea(triangle) {
  return (
    (triangle[1].x - triangle[0].x) * (triangle[2].y - triangle[0].y)
    - (triangle[2].x - triangle[0].x) * (triangle[1].y - triangle[0].y)
  );
}

function stableTriangle(triangle) {
  const doubledArea = Math.abs(signedTriangleArea(triangle));
  const edgeA = Math.hypot(triangle[1].x - triangle[0].x, triangle[1].y - triangle[0].y);
  const edgeB = Math.hypot(triangle[2].x - triangle[1].x, triangle[2].y - triangle[1].y);
  const edgeC = Math.hypot(triangle[0].x - triangle[2].x, triangle[0].y - triangle[2].y);
  const shortestEdge = Math.min(edgeA, edgeB, edgeC);
  const edgeRatio = Math.max(edgeA, edgeB, edgeC) / Math.max(shortestEdge, 1e-9);
  return doubledArea > 0.000001 && doubledArea < 0.08 && edgeRatio < 18;
}

export function buildMeshFrameData(mesh, landmarks, cover, pose, mirror) {
  const count = mesh?.vertexIndices?.length || 0;
  const positions = new Float32Array(count * 2);
  const visibility = new Float32Array(count);
  const yaw = pose?.yaw || 0;
  let stableTriangleCount = 0;
  let orientationCulledTriangleCount = 0;

  for (let index = 0; index < count; index += 3) {
    const triangle = [];
    for (let corner = 0; corner < 3; corner += 1) {
      const landmark = landmarks?.[mesh.vertexIndices[index + corner]];
      if (!landmark) {
        triangle.length = 0;
        break;
      }
      triangle.push(landmarkToClip(landmark, cover, mirror));
    }
    const geometryStable = triangle.length === 3 && stableTriangle(triangle);
    const uvOffset = index * 2;
    const uvSignedArea = geometryStable ? (
      (mesh.uvCoordinates[uvOffset + 2] - mesh.uvCoordinates[uvOffset])
      * (mesh.uvCoordinates[uvOffset + 5] - mesh.uvCoordinates[uvOffset + 1])
      - (mesh.uvCoordinates[uvOffset + 4] - mesh.uvCoordinates[uvOffset])
      * (mesh.uvCoordinates[uvOffset + 3] - mesh.uvCoordinates[uvOffset + 1])
    ) : 0;
    const orientationStable = geometryStable && (
      signedTriangleArea(triangle)
      * uvSignedArea
      * (mirror ? -1 : 1)
    ) > 0;
    if (geometryStable && !orientationStable) orientationCulledTriangleCount += 1;
    const validTriangle = geometryStable && orientationStable;
    if (validTriangle) stableTriangleCount += 1;

    for (let corner = 0; corner < 3; corner += 1) {
      const expandedIndex = index + corner;
      const landmarkIndex = mesh.vertexIndices[expandedIndex];
      const landmark = landmarks?.[landmarkIndex];
      const point = triangle[corner] || { x: 0, y: 0 };
      positions[expandedIndex * 2] = point.x;
      positions[expandedIndex * 2 + 1] = point.y;
      let sideFade = 1;
      if (landmark && Math.abs(yaw) > 22) {
        const farSide = yaw > 0 ? landmark.x < 0.38 : landmark.x > 0.62;
        if (farSide) sideFade = Math.max(0.3, 1 - (Math.abs(yaw) - 22) / 35);
      }
      visibility[expandedIndex] = validTriangle ? sideFade : 0;
    }
  }

  return {
    positions,
    visibility,
    stableTriangleCount,
    orientationCulledTriangleCount,
    triangleCount: count / 3,
  };
}

export class TuongRenderer {
  constructor(canvas, { mirror = true } = {}) {
    this.canvas = canvas;
    this.mirror = mirror;
    this.gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    if (!this.gl) throw new Error('WebGL2 is required for live Try-On.');

    this.videoProgram = createProgram(this.gl, VIDEO_VERTEX_SHADER, VIDEO_FRAGMENT_SHADER);
    this.maskProgram = createProgram(this.gl, MASK_VERTEX_SHADER, MASK_FRAGMENT_SHADER);
    this.videoTexture = createTexture(this.gl);
    this.atlasTextures = [];
    this.parseTexture = createTexture(this.gl);
    this.videoPositionBuffer = this.gl.createBuffer();
    this.videoUvBuffer = this.gl.createBuffer();
    this.maskPositionBuffer = this.gl.createBuffer();
    this.maskUvBuffer = this.gl.createBuffer();
    this.maskParseUvBuffer = this.gl.createBuffer();
    this.maskVisibilityBuffer = this.gl.createBuffer();
    this.mesh = null;
    this.template = null;
    this.hasParse = false;
    this.parseEma = null;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.videoPositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), this.gl.STATIC_DRAW);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.videoUvBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      0, 0, 1, 0, 0, 1,
      0, 1, 1, 0, 1, 1,
    ]), this.gl.STATIC_DRAW);
  }

  setMirror(mirror) {
    this.mirror = Boolean(mirror);
  }

  setTemplate({ template, mesh, layers }) {
    const gl = this.gl;
    this.template = template;
    this.mesh = mesh;
    this.atlasTextures.forEach(({ texture }) => gl.deleteTexture(texture));
    this.atlasTextures = layers.map((layer) => {
      const texture = createTexture(gl);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, layer.image);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      return { ...layer, texture };
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, this.maskUvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uvCoordinates, gl.STATIC_DRAW);
    if (!this.hasParse) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.maskParseUvBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(mesh.vertexIndices.length * 2),
        gl.DYNAMIC_DRAW,
      );
    }
  }

  updateSegmentation({ alpha, width, height, roi, sourceLandmarks }) {
    const parseUvs = createReprojectedParseUvs(this.mesh, sourceLandmarks, roi);
    if (!alpha || !width || !height || !parseUvs) return;
    if (!this.parseEma || this.parseEma.length !== alpha.length) {
      this.parseEma = new Uint8Array(alpha);
    } else {
      for (let index = 0; index < alpha.length; index += 1) {
        this.parseEma[index] = Math.round(this.parseEma[index] * 0.58 + alpha[index] * 0.42);
      }
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.parseTexture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, height, 0, gl.RED, gl.UNSIGNED_BYTE, this.parseEma);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.maskParseUvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, parseUvs, gl.DYNAMIC_DRAW);
    this.hasParse = true;
  }

  clearSegmentation() {
    this.hasParse = false;
    this.parseEma = null;
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(this.canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(this.canvas.clientHeight * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.gl.viewport(0, 0, width, height);
  }

  drawVideo(video, cover) {
    const gl = this.gl;
    gl.useProgram(this.videoProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.uniform1i(gl.getUniformLocation(this.videoProgram, 'u_video'), 0);
    gl.uniform2f(gl.getUniformLocation(this.videoProgram, 'u_crop'), cover.cropX, cover.cropY);
    gl.uniform1i(gl.getUniformLocation(this.videoProgram, 'u_mirror'), this.mirror);

    const position = gl.getAttribLocation(this.videoProgram, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.videoPositionBuffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uv = gl.getAttribLocation(this.videoProgram, 'a_uv');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.videoUvBuffer);
    gl.enableVertexAttribArray(uv);
    gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);
    gl.disable(gl.BLEND);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  updateMeshBuffers(landmarks, cover, pose) {
    const { positions, visibility } = buildMeshFrameData(
      this.mesh,
      landmarks,
      cover,
      pose,
      this.mirror,
    );

    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.maskPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.maskVisibilityBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, visibility, gl.DYNAMIC_DRAW);
  }

  drawMask(landmarks, cover, pose, alpha, intensity) {
    if (!this.mesh || !this.template || !landmarks || alpha <= 0) return;
    const gl = this.gl;
    this.updateMeshBuffers(landmarks, cover, pose);
    gl.useProgram(this.maskProgram);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const attributes = [
      ['a_position', this.maskPositionBuffer, 2],
      ['a_uv', this.maskUvBuffer, 2],
      ['a_parse_uv', this.maskParseUvBuffer, 2],
      ['a_visibility', this.maskVisibilityBuffer, 1],
    ];
    for (const [name, buffer, size] of attributes) {
      const location = gl.getAttribLocation(this.maskProgram, name);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    }

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.parseTexture);
    gl.uniform1i(gl.getUniformLocation(this.maskProgram, 'u_parse'), 1);
    gl.uniform1i(gl.getUniformLocation(this.maskProgram, 'u_has_parse'), this.hasParse);
    gl.uniform1f(gl.getUniformLocation(this.maskProgram, 'u_alpha'), alpha * poseOpacity(pose, this.template.pose_limits));
    gl.uniform1f(gl.getUniformLocation(this.maskProgram, 'u_intensity'), intensity);
    for (const layer of this.atlasTextures) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, layer.texture);
      gl.uniform1i(gl.getUniformLocation(this.maskProgram, 'u_atlas'), 0);
      gl.drawArrays(gl.TRIANGLES, 0, this.mesh.vertexIndices.length);
    }
  }

  render({ video, landmarks, pose, alpha = 1, intensity = 1, compare = false }) {
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    this.resize();
    const cover = calculateCoverTransform(
      video.videoWidth,
      video.videoHeight,
      this.canvas.width,
      this.canvas.height,
    );
    this.drawVideo(video, cover);
    if (!compare) this.drawMask(landmarks, cover, pose, alpha, intensity);
  }

  async capture(type = 'image/png', quality = 0.94) {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Unable to capture the composited Try-On canvas.'));
      }, type, quality);
    });
  }

  dispose() {
    const gl = this.gl;
    [this.videoTexture, this.parseTexture, ...this.atlasTextures.map((layer) => layer.texture)]
      .forEach((texture) => gl.deleteTexture(texture));
    [
      this.videoPositionBuffer,
      this.videoUvBuffer,
      this.maskPositionBuffer,
      this.maskUvBuffer,
      this.maskParseUvBuffer,
      this.maskVisibilityBuffer,
    ].forEach((buffer) => gl.deleteBuffer(buffer));
    gl.deleteProgram(this.videoProgram);
    gl.deleteProgram(this.maskProgram);
    this.mesh = null;
    this.template = null;
    this.atlasTextures = [];
  }
}
