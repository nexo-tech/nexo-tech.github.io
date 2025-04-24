const defaultConfig = {
  animationSpeed: 0.4,
  colors: [[0, 1, 1]], // normalized RGB
  dotSize: 3,
  opacities: [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
};

export function addDotBg(container, config) {
  const options = { ...defaultConfig, ...config };

  // Create container structure
  // const container = document.createElement("div");
  // container.className = "dot-bg-container";

  const canvas = document.createElement("canvas");
  canvas.className = "dot-bg-canvas";

  const gradient = document.createElement("div");
  gradient.className = "dot-bg-gradient";

  container.appendChild(canvas);
  container.appendChild(gradient);

  // // Replace element's content with our container
  // element.innerHTML = "";
  // element.appendChild(container);

  // Initialize WebGL
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    console.error("WebGL2 not supported");
    return;
  }

  function compile(src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
  }

  const vsSource = `#version 300 es
in vec2 a_pos;
void main() {
gl_Position = vec4(a_pos, 0, 1);
}`;
  const fsSource = `#version 300 es
        precision mediump float;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        out vec4 fragColor;
        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }
        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }
      void main() {
            vec2 st = gl_FragCoord.xy;
         st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
           st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));
      float opacity = step(0.0, st.x);
      opacity *= step(0.0, st.y);

      vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

      float frequency = 5.0;
      float show_offset = random(st2);
      float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency) + 1.0);
      opacity *= u_opacities[int(rand * 10.0)];
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

      vec3 color = u_colors[int(show_offset * 6.0)];


      fragColor = vec4(color, opacity);
      fragColor.rgb *= fragColor.a;
        }
  `;

  const vs = compile(vsSource, gl.VERTEX_SHADER);
  const fs = compile(fsSource, gl.FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );

  function updateSize() {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  updateSize();
  new ResizeObserver(updateSize).observe(container);

  function render(time) {
    time *= 0.01;
    // console.log(time);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    const posLoc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(posLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(gl.getUniformLocation(program, "u_time"), time);
    gl.uniform1f(
      gl.getUniformLocation(program, "u_animSpeed"),
      options.animationSpeed
    );
    gl.uniform2f(
      gl.getUniformLocation(program, "u_resolution"),
      canvas.width,
      canvas.height
    );
    gl.uniform1f(gl.getUniformLocation(program, "u_dot_size"), options.dotSize);
    gl.uniform1f(
      gl.getUniformLocation(program, "u_total_size"),
      options.dotSize * 2
    );
    gl.uniform1fv(
      gl.getUniformLocation(program, "u_opacities"),
      options.opacities
    );

    // const flat = new Float32Array(options.colors.flat());
    // const padded = new Float32Array(18);
    // padded.set(flat);
    const colors = options.colors;
    let colorsArray = [
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
      colors[0],
    ];
    if (colors.length === 2) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[1],
      ];
    } else if (colors.length === 3) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[2],
        colors[2],
      ];
    }

    gl.uniform3fv(
      gl.getUniformLocation(program, "u_colors"),
      new Float32Array(
        colorsArray
          .map((color) => [color[0] / 255, color[1] / 255, color[2] / 255])
          .flat()
      )
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
