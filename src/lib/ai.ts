import { db } from './db'

interface AIPlatform {
  id: string
  name: string
  baseUrl: string
  models: string[]
  defaultModel: string
}

const PLATFORMS: AIPlatform[] = [
  { id: 'qwen', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: ['qwen3.5-plus', 'qwen-max', 'qwen-turbo', 'qwen-long'], defaultModel: 'qwen3.5-plus' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', models: ['deepseek-chat', 'deepseek-reasoner'], defaultModel: 'deepseek-chat' },
  { id: 'kimi', name: 'Kimi', baseUrl: 'https://api.moonshot.cn/v1', models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'], defaultModel: 'moonshot-v1-8k' },
  { id: 'minimax', name: 'MiniMax', baseUrl: 'https://api.minimax.chat/v1', models: ['MiniMax-M2.7', 'MiniMax-M2.7-highspeed', 'MiniMax-M2.5', 'MiniMax-M2.5-highspeed', 'MiniMax-M2.1'], defaultModel: 'MiniMax-M2.7' },
]

export function getPlatforms() {
  return PLATFORMS
}

export async function fetchModels(platform: string, apiKey: string): Promise<string[]> {
  var p = PLATFORMS.find(function(p) { return p.id === platform })
  if (!p) return []

  try {
    var res = await fetch(p.baseUrl + '/models', {
      headers: { 'Authorization': 'Bearer ' + apiKey },
    })
    if (!res.ok) return p.models
    var data = await res.json()
    // OpenAI-compatible response: { data: [{ id: 'model-name', ... }, ...] }
    if (data.data && Array.isArray(data.data)) {
      var ids = data.data.map(function(m: any) { return m.id })
      return ids.length > 0 ? ids : p.models
    }
    return p.models
  } catch (e) {
    return p.models
  }
}

export async function chat(platform: string, apiKey: string, messages: { role: string; content: string }[], model?: string) {
  var p = PLATFORMS.find(function(p) { return p.id === platform })
  if (!p) throw new Error('不支持的AI平台')

  var startTime = Date.now()
  var useModel = model || p.defaultModel

  var response = await fetch(p.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: useModel,
      messages: [
        { role: 'system', content: '你是古诗词教师助手，擅长诗词讲解、字词释义和创作背景。用简洁易懂的语言回答，适合学生理解。' },
        ...messages,
      ],
      stream: false,
    }),
  })

  var duration = Date.now() - startTime

  if (!response.ok) {
    var err = await response.json().catch(function() { return {} })
    throw new Error(err.error?.message || '请求失败: ' + response.status)
  }

  var data = await response.json()
  var usage = data.usage || {}

  try {
    await db.aiCallLogs.add({
      platform: platform,
      model: useModel,
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      duration: duration,
      createdAt: new Date(),
    })
  } catch (e) {
    // silent
  }

  return data.choices[0]?.message?.content || ''
}
