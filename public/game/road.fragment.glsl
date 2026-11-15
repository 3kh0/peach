

#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif
precision highp int;
uniform 	vec4 _Time;
uniform 	float _offset;
uniform 	float _freeze;
uniform 	float _colorOffset;
uniform 	float _lastChunk;
uniform 	float _timeScale;
uniform 	vec4 _startWorldPos;
uniform 	vec4 _EndWorldPos;
uniform 	float _pathLength;
uniform 	float _scale;
uniform lowp sampler2D _MainTex;
varying highp vec2 vs_TEXCOORD0;
varying highp vec4 vs_COLOR0;
varying highp vec3 vs_TEXCOORD1;
#define SV_Target0 gl_FragColor
vec4 u_xlat0;
bool u_xlatb0;
vec4 u_xlat1;
vec3 u_xlat2;
bvec4 u_xlatb2;
vec4 u_xlat3;
vec2 u_xlat4;
bvec3 u_xlatb5;
float u_xlat6;
vec2 u_xlat8;
bool u_xlatb8;
vec3 u_xlat9;
float u_xlat10;
float u_xlat12;
bool u_xlatb12;
float u_xlat14;
float u_xlat18;
bool u_xlatb18;
float u_xlat20;
bool u_xlatb20;
void main()
{
    u_xlat0 = texture2D(_MainTex, vs_TEXCOORD0.xy);
    u_xlat1 = u_xlat0 * vs_COLOR0;
    u_xlat18 = dot(u_xlat1.xyz, u_xlat1.xyz);
    u_xlat18 = sqrt(u_xlat18);
    u_xlatb18 = 0.0<u_xlat18;
    if(u_xlatb18){
        u_xlat18 = (-_freeze) + 1.0;
        u_xlat2.xyz = (-_startWorldPos.xyz) + _EndWorldPos.xyz;
        u_xlat20 = dot(u_xlat2.xyz, u_xlat2.xyz);
        u_xlat3.x = sqrt(u_xlat20);
        u_xlat9.xyz = vs_TEXCOORD1.xyz + (-_startWorldPos.xyz);
        u_xlat4.x = dot(u_xlat9.xyz, u_xlat9.xyz);
        u_xlat10 = sqrt(u_xlat4.x);
        u_xlat4.x = inversesqrt(u_xlat4.x);
        u_xlat9.xyz = u_xlat9.xyz * u_xlat4.xxx;
        u_xlat20 = inversesqrt(u_xlat20);
        u_xlat2.xyz = vec3(u_xlat20) * u_xlat2.xyz;
        u_xlat2.x = dot(u_xlat9.xyz, u_xlat2.xyz);
        u_xlat2.x = u_xlat2.x * 0.0174527802;
        u_xlat2.x = cos(u_xlat2.x);
        u_xlat2.x = u_xlat2.x * u_xlat10;
        u_xlatb8 = u_xlat1.y<u_xlat1.x;
        u_xlat8.xy = (bool(u_xlatb8)) ? u_xlat1.xy : u_xlat1.yx;
        u_xlatb20 = u_xlat8.x<u_xlat1.z;
        u_xlat8.x = (u_xlatb20) ? u_xlat1.z : u_xlat8.x;
        u_xlatb20 = u_xlat1.z<u_xlat8.y;
        u_xlat14 = (u_xlatb20) ? u_xlat1.z : u_xlat8.y;
        u_xlat14 = (-u_xlat14) + u_xlat8.x;
        u_xlatb20 = u_xlat14!=0.0;
        u_xlat4.y = u_xlat14 / u_xlat8.x;
        u_xlat0.xyz = (-u_xlat0.yzx) * vs_COLOR0.yzx + u_xlat8.xxx;
        u_xlat9.x = u_xlat14 * 6.0;
        u_xlat0.xyz = vec3(u_xlat14) * vec3(3.0, 3.0, 3.0) + u_xlat0.xyz;
        u_xlat0.xyz = u_xlat0.xyz / u_xlat9.xxx;
        u_xlat14 = (-u_xlat0.x) + u_xlat0.y;
        u_xlat9.xy = u_xlat0.zx + vec2(0.333333313, 0.666666687);
        u_xlatb5.xyz = equal(u_xlat1.xyzx, u_xlat8.xxxx).xyz;
        u_xlat0.xy = (-u_xlat0.yz) + u_xlat9.xy;
        u_xlat6 = u_xlatb5.z ? u_xlat0.y : float(0.0);
        u_xlat0.x = (u_xlatb5.y) ? u_xlat0.x : u_xlat6;
        u_xlat4.x = (u_xlatb5.x) ? u_xlat14 : u_xlat0.x;
        u_xlat0.xy = bool(u_xlatb20) ? u_xlat4.xy : vec2(0.0, 0.0);
        u_xlatb12 = _lastChunk==1.0;
        u_xlat2.x = u_xlat2.x / u_xlat3.x;
        u_xlat14 = (-u_xlat2.x) + u_xlat8.x;
        u_xlat14 = clamp(u_xlat14, 0.0, 1.0);
        u_xlat3.z = (u_xlatb12) ? u_xlat14 : u_xlat8.x;
        u_xlat12 = _scale * _pathLength;
        u_xlat12 = u_xlat12 * u_xlat2.x + _colorOffset;
        u_xlat0.x = u_xlat0.x + u_xlat12;
        u_xlat0.x = _offset * _scale + u_xlat0.x;
        u_xlat12 = _Time.x * _timeScale;
        u_xlat0.x = u_xlat12 * u_xlat18 + u_xlat0.x;
        u_xlat0.x = fract(u_xlat0.x);
        u_xlat12 = u_xlat0.x * 6.0;
        u_xlat12 = floor(u_xlat12);
        u_xlat18 = (-u_xlat0.y) + 1.0;
        u_xlat3.x = u_xlat18 * u_xlat3.z;
        u_xlat0.x = u_xlat0.x * 6.0 + (-u_xlat12);
        u_xlat0.w = (-u_xlat0.y) * u_xlat0.x + 1.0;
        u_xlat0.x = (-u_xlat0.x) + 1.0;
        u_xlat0.x = (-u_xlat0.y) * u_xlat0.x + 1.0;
        u_xlat3.yw = u_xlat0.xw * u_xlat3.zz;
        u_xlatb2 = equal(vec4(u_xlat12), vec4(0.0, 1.0, 2.0, 3.0));
        u_xlatb0 = u_xlat12==4.0;
        u_xlat0.xz = (bool(u_xlatb0)) ? u_xlat3.yz : u_xlat3.zw;
        u_xlat0.y = u_xlat3.x;
        u_xlat0.xyz = (u_xlatb2.w) ? u_xlat3.xwz : u_xlat0.xyz;
        u_xlat0.xyz = (u_xlatb2.z) ? u_xlat3.xzy : u_xlat0.xyz;
        u_xlat0.xyz = (u_xlatb2.y) ? u_xlat3.wzx : u_xlat0.xyz;
        u_xlat1.xyz = (u_xlatb2.x) ? u_xlat3.zyx : u_xlat0.xyz;
    }
    SV_Target0 = u_xlat1;
    return;
}

