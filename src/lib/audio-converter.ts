/**
 * Conversor de áudio
 * Converte WAV para MP3 usando ffmpeg ou biblioteca Python
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs/promises'
import * as path from 'path'
import { randomUUID } from 'crypto'

const execAsync = promisify(exec)

/**
 * Converter WAV para MP3 usando Python (pydub)
 * 
 * @param wavBuffer Buffer do arquivo WAV
 * @returns Buffer do arquivo MP3
 */
export async function convertWavToMp3(wavBuffer: Buffer): Promise<Buffer> {
  const tmpDir = path.join(process.cwd(), 'tmp', 'audio-converter')
  await fs.mkdir(tmpDir, { recursive: true })
  
  const inputPath = path.join(tmpDir, `input_${randomUUID()}.wav`)
  const outputPath = path.join(tmpDir, `output_${randomUUID()}.mp3`)
  
  try {
    // Salvar WAV temporariamente
    await fs.writeFile(inputPath, wavBuffer)
    
    // Converter usando Python (pydub)
    const pythonScript = path.join(process.cwd(), 'workers', 'convert_wav_to_mp3.py')
    const pythonCmd = process.env.PYTHON_CMD || 'python'
    const command = `${pythonCmd} ${pythonScript} --input "${inputPath}" --output "${outputPath}"`
    
    await execAsync(command)
    
    // Ler MP3
    const mp3Buffer = await fs.readFile(outputPath)
    
    // Limpar arquivos temporários
    await fs.unlink(inputPath).catch(() => {})
    await fs.unlink(outputPath).catch(() => {})
    
    return mp3Buffer
  } catch (error: any) {
    // Limpar arquivos em caso de erro
    await fs.unlink(inputPath).catch(() => {})
    await fs.unlink(outputPath).catch(() => {})
    
    throw new Error(`Erro ao converter WAV para MP3: ${error.message}`)
  }
}

