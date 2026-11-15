

uniform 	vec4 _WorldSpaceLightPos0;

uniform mat4 inverseModelMatrix;
uniform 	mediump vec4 glstate_lightmodel_ambient;
uniform mat4 viewProjectionMatrix;
uniform 	vec4 _LightColor0;
uniform 	vec4 _MainTex_ST;
uniform 	vec4 _Color;
uniform 	float _refl;
uniform 	float _saturation;
uniform 	float _brightness;



varying highp vec2 vs_TEXCOORD0;
varying highp vec4 vs_COLOR0;
varying highp vec3 vs_TEXCOORD1;
vec4 u_xlat0;
bvec4 u_xlatb0;
vec4 u_xlat1;
mediump vec4 u_xlat16_1;
vec3 u_xlat2;
bvec4 u_xlatb2;
vec3 u_xlat3;
float u_xlat4;
bool u_xlatb4;
float u_xlat8;
bool u_xlatb8;
vec2 u_xlat9;
float u_xlat12;
float u_xlat13;
float u_xlat14;
void main()
{
    vs_TEXCOORD0.xy = vec4(uv, 0.0, 0.0).xy * _MainTex_ST.xy + _MainTex_ST.zw;
    u_xlatb0.x = _Color.y<_Color.x;
    u_xlat0.xy = (u_xlatb0.x) ? _Color.xy : _Color.yx;
    u_xlatb8 = _Color.z<u_xlat0.y;
    u_xlat4 = (u_xlatb8) ? _Color.z : u_xlat0.y;
    u_xlatb8 = u_xlat0.x<_Color.z;
    u_xlat0.x = (u_xlatb8) ? _Color.z : u_xlat0.x;
    u_xlat4 = (-u_xlat4) + u_xlat0.x;
    u_xlat1.xyz = u_xlat0.xxx + (-_Color.yzx);
    u_xlatb0.xzw = equal(u_xlat0.xxxx, _Color.xxyz).xzw;
    u_xlat1.xyz = vec3(u_xlat4) * vec3(3.0, 3.0, 3.0) + u_xlat1.xyz;
    u_xlat13 = u_xlat4 * 6.0;
    u_xlatb4 = u_xlat4!=0.0;
    u_xlat1.xyz = u_xlat1.xyz / vec3(u_xlat13);
    u_xlat2.xy = u_xlat1.zx + vec2(0.333333313, 0.666666687);
    u_xlat9.xy = (-u_xlat1.yz) + u_xlat2.xy;
    u_xlat1.x = (-u_xlat1.x) + u_xlat1.y;
    u_xlat12 = u_xlatb0.w ? u_xlat9.y : float(0.0);
    u_xlat8 = (u_xlatb0.z) ? u_xlat9.x : u_xlat12;
    u_xlat0.x = (u_xlatb0.x) ? u_xlat1.x : u_xlat8;
    u_xlat0.x = u_xlatb4 ? u_xlat0.x : float(0.0);
    u_xlat4 = u_xlat0.x * 6.0;
    u_xlat4 = floor(u_xlat4);
    u_xlat0.x = u_xlat0.x * 6.0 + (-u_xlat4);
    u_xlat8 = (-u_xlat0.x) + 1.0;
    u_xlat0.x = (-_saturation) * u_xlat0.x + 1.0;
    u_xlat1.y = u_xlat0.x * _brightness;
    u_xlat0.x = (-_saturation) * u_xlat8 + 1.0;
    u_xlat0.x = u_xlat0.x * _brightness;
    u_xlat1.w = u_xlat0.x;
    u_xlatb2 = equal(vec4(u_xlat4), vec4(0.0, 1.0, 2.0, 3.0));
    u_xlatb4 = u_xlat4==4.0;
    u_xlat0.z = _brightness;
    u_xlat1.z = _brightness;
    u_xlat0.xz = (bool(u_xlatb4)) ? u_xlat0.xz : u_xlat1.zy;
    u_xlat12 = (-_saturation) + 1.0;
    u_xlat1.x = u_xlat12 * _brightness;
    u_xlat0.y = u_xlat1.x;
    u_xlat0.xyz = (u_xlatb2.w) ? u_xlat1.xyz : u_xlat0.xyz;
    u_xlat0.xyz = (u_xlatb2.z) ? u_xlat1.xzw : u_xlat0.xyz;
    u_xlat0.xyz = (u_xlatb2.y) ? u_xlat1.yzx : u_xlat0.xyz;
    u_xlat0.xyz = (u_xlatb2.x) ? u_xlat1.zwx : u_xlat0.xyz;
    u_xlat16_1 = glstate_lightmodel_ambient + glstate_lightmodel_ambient;
    u_xlat0.xyz = u_xlat0.xyz * u_xlat16_1.xyz;
    u_xlat0.w = u_xlat16_1.w * _Color.w;
    u_xlat2.x = dot(normal.xyz, inverseModelMatrix[0].xyz);
    u_xlat2.y = dot(normal.xyz, inverseModelMatrix[1].xyz);
    u_xlat2.z = dot(normal.xyz, inverseModelMatrix[2].xyz);
    u_xlat14 = dot(u_xlat2.xyz, u_xlat2.xyz);
    u_xlat14 = inversesqrt(u_xlat14);
    u_xlat2.xyz = vec3(u_xlat14) * u_xlat2.xyz;
    u_xlat14 = dot(_WorldSpaceLightPos0.xyz, _WorldSpaceLightPos0.xyz);
    u_xlat14 = inversesqrt(u_xlat14);
    u_xlat3.xyz = vec3(u_xlat14) * _WorldSpaceLightPos0.xyz;
    u_xlat2.x = dot(u_xlat2.xyz, u_xlat3.xyz);
    u_xlat2.x = max(u_xlat2.x, 0.0);
    u_xlat1.xyz = u_xlat2.xxx * _LightColor0.xyz;
    u_xlat1.w = 1.0;
    vs_COLOR0 = u_xlat1 * vec4(_refl) + u_xlat0;
    u_xlat0 = vec4(position, 1.0).yyyy * modelMatrix[1];
    u_xlat0 = modelMatrix[0] * vec4(position, 1.0).xxxx + u_xlat0;
    u_xlat0 = modelMatrix[2] * vec4(position, 1.0).zzzz + u_xlat0;
    vs_TEXCOORD1.xyz = modelMatrix[3].xyz * vec4(position, 1.0).www + u_xlat0.xyz;
    u_xlat0 = u_xlat0 + modelMatrix[3];
    u_xlat1 = u_xlat0.yyyy * viewProjectionMatrix[1];
    u_xlat1 = viewProjectionMatrix[0] * u_xlat0.xxxx + u_xlat1;
    u_xlat1 = viewProjectionMatrix[2] * u_xlat0.zzzz + u_xlat1;
    gl_Position = viewProjectionMatrix[3] * u_xlat0.wwww + u_xlat1;
    return;
}

