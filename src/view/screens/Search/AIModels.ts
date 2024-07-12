import {HfInference} from '@huggingface/inference' //Agregado nuevo

import {logger} from '#/logger'

const hf = new HfInference('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')
export const generateAIQuery = async (prompt: string) => {
  try {
    const output = await hf.chatCompletion({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      messages: [{role: 'user', content: `${prompt} ,just the answer`}],
      max_tokens: 10, // Cambiado a max_tokens
      temperature: 0.1,
      seed: 0, // Opcional
    })
    const message = output.choices[0].message
    return message.content
  } catch (e: any) {
    logger.error('Failed to generate chat completion', {message: e.message})
    throw e
  }
}
