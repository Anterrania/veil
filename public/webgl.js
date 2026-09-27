/* VIPER WebGL height preview. Canvas 2D remains the editor. */
const GLRealm = (() => {
  let gl, canvas, prog, buf, n = 36;
  function compile(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  function mount(el, heights) {
    canvas = el;
    gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return false;
    const vs = compile("attribute vec3 p;varying float h;void main(){h=p.z;gl_Position=vec4(p.x/18.0-1.0,p.y/18.0-1.0,0.0,1.0);}", gl.VERTEX_SHADER);
    const fs = compile("precision mediump float;varying float h;void main(){gl_FragColor=vec4(0.2+h*0.06,0.45,0.25,1.0);}", gl.FRAGMENT_SHADER);
    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    buf = gl.createBuffer();
    pump(heights);
    return true;
  }
  function pump(heights) {
    if (!gl || !heights) return;
    const verts = [];
    for (let y = 0; y < n - 1; y++) {
      for (let x = 0; x < n - 1; x++) {
        const h = heights[y * n + x] || 0;
        verts.push(x, y, h, x + 1, y, h, x, y + 1, h);
      }
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.DYNAMIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.04, 0.06, 0.12, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, verts.length / 3);
  }
  return { mount, pump, ok: () => !!gl };
})();
