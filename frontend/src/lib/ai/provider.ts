/**
 * Chat provider abstraction.
 *
 * Generic mode uses the OpenAI SDK against the user's configured provider
 * base URL / key / model. Zolai mode posts to the local zolai-core /chat/zolai.
 */
import OpenAI from 'openai'

import type { ChatMessageRole } from '@/lib/zolai-core/types'
import { loadSettings } from '@/lib/zolai-core/config'
import { postJson } from '@/lib/zolai-core/client'
import { ROUTES } from '@/lib/zolai-core/contract'

export class ChatProviderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChatProviderError'
  }
}

/** Non-streaming generic completion via the OpenAI-compatible provider. */
export async function chatCompletion(messages: ChatMessageRole[]): Promise<string> {
  const settings = loadSettings()
  if (!settings.apiKey) {
    throw new ChatProviderError('No API key configured. Open Settings and set one for generic mode.')
  }
  const baseURL = `${settings.baseUrl.replace(/\/+$/, '')}/v1`
  const client = new OpenAI({ apiKey: settings.apiKey, baseURL, dangerouslyAllowBrowser: true })
  try {
    const completion = await client.chat.completions.create({
      model: settings.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })
    return completion.choices[0]?.message?.content ?? ''
  } catch (cause) {
    throw new ChatProviderError(`Provider request failed: ${String(cause)}`)
  }
}

/**
 * Streaming chat.
 * - Zolai mode: buffered POST /chat/zolai with { message }, reads zolai_response.
 * - Generic mode: OpenAI SDK streaming.
 * Always resolves by handing final text to `onToken` (token-by-token when streaming).
 */
export async function chatStream(
  messages: ChatMessageRole[],
  onToken: (token: string) => void,
): Promise<void> {
  const settings = loadSettings()

  if (settings.zolaiMode) {
    await chatStreamZolai(messages, onToken)
    return
  }

  if (!settings.apiKey) {
    throw new ChatProviderError('No API key configured. Open Settings and set one for generic mode.')
  }
  const baseURL = `${settings.baseUrl.replace(/\/+$/, '')}/v1`
  const client = new OpenAI({ apiKey: settings.apiKey, baseURL, dangerouslyAllowBrowser: true })
  try {
    const stream = await client.chat.completions.create({
      model: settings.model,
      stream: true,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) onToken(delta)
    }
  } catch (cause) {
    throw new ChatProviderError(`Provider streaming failed: ${String(cause)}`)
  }
}

async function chatStreamZolai(
  messages: ChatMessageRole[],
  onToken: (token: string) => void,
): Promise<void> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const message = lastUser?.content ?? ''

  try {
    const data = await postJson<{ zolai_response: string }>(ROUTES.chatZolai.path, { message })
    const text = data.zolai_response ?? ''
    if (text) onToken(text)
  } catch (cause) {
    throw new ChatProviderError(`Zolai chat failed: ${String(cause)}`)
  }
}