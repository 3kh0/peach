import { ShaderMaterial, Vector2, WebGLRenderTarget, type WebGLRenderer } from "three";
import { FullScreenQuad, Pass } from "three/addons/postprocessing/Pass.js";

const vertexShader = `varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

export class GameBloom extends Pass {
  private a = new WebGLRenderTarget(1, 1, { depthBuffer: false });
  private b = new WebGLRenderTarget(1, 1, { depthBuffer: false });
  private bright = new ShaderMaterial({
    vertexShader,
    depthTest: false,
    depthWrite: false,
    uniforms: { source: { value: null }, texel: { value: new Vector2() } },
    fragmentShader: `uniform sampler2D source; uniform vec2 texel; varying vec2 vUv;
void main() {
 vec4 c = texture2D(source, vUv + texel);
 c += texture2D(source, vUv + texel * vec2(-.5, -.5));
 c += texture2D(source, vUv + texel * vec2(.5, -.5));
 c += texture2D(source, vUv + texel * vec2(-.5, .5));
 gl_FragColor = max(c * .25 - .25, 0.) * 2.5;
}`,
  });
  private blur = new ShaderMaterial({
    vertexShader,
    depthTest: false,
    depthWrite: false,
    uniforms: { source: { value: null }, delta: { value: new Vector2() } },
    fragmentShader: `uniform sampler2D source; uniform vec2 delta; varying vec2 vUv;
void main() {
 vec4 c = texture2D(source, vUv) * .324;
 c += (texture2D(source, vUv - delta) + texture2D(source, vUv + delta)) * .232;
 c += (texture2D(source, vUv - delta * 2.) + texture2D(source, vUv + delta * 2.)) * .0855;
 c += (texture2D(source, vUv - delta * 3.) + texture2D(source, vUv + delta * 3.)) * .0205;
 gl_FragColor = c;
}`,
  });
  private composite = new ShaderMaterial({
    vertexShader,
    depthTest: false,
    depthWrite: false,
    uniforms: { source: { value: null }, bloom: { value: null } },
    fragmentShader: `uniform sampler2D source; uniform sampler2D bloom; varying vec2 vUv;
void main() { gl_FragColor = texture2D(source, vUv) + texture2D(bloom, vUv); }`,
  });
  private quad = new FullScreenQuad(this.bright);

  override setSize(width: number, height: number) {
    this.a.setSize(Math.max(1, Math.floor(width / 4)), Math.max(1, Math.floor(height / 4)));
    this.b.setSize(this.a.width, this.a.height);
    this.bright.uniforms.texel!.value.set(1 / width, 1 / height);
  }

  override render(renderer: WebGLRenderer, write: WebGLRenderTarget, read: WebGLRenderTarget) {
    this.bright.uniforms.source!.value = read.texture;
    this.quad.material = this.bright;
    renderer.setRenderTarget(this.a);
    this.quad.render(renderer);
    this.quad.material = this.blur;
    for (let i = 0; i < 2; i++) {
      this.blur.uniforms.source!.value = this.a.texture;
      this.blur.uniforms.delta!.value.set(0, (3 + i) / this.a.height);
      renderer.setRenderTarget(this.b);
      this.quad.render(renderer);
      this.blur.uniforms.source!.value = this.b.texture;
      this.blur.uniforms.delta!.value.set((3 + i) / this.a.width, 0);
      renderer.setRenderTarget(this.a);
      this.quad.render(renderer);
    }
    this.quad.material = this.composite;
    this.composite.uniforms.source!.value = read.texture;
    this.composite.uniforms.bloom!.value = this.a.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : write);
    this.quad.render(renderer);
  }

  override dispose() {
    this.a.dispose();
    this.b.dispose();
    this.bright.dispose();
    this.blur.dispose();
    this.composite.dispose();
    this.quad.dispose();
  }
}
