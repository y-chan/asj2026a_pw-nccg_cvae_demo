'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

const AudioComparisonDemo = dynamic(() => import('./AudioComparisonDemo'), {
  ssr: false,
  loading: () => (
    <div className="py-8 text-sm text-neutral-600" role="status">
      比較デモを読み込み中…
    </div>
  ),
})

export default function ComparisonDemoLoader({ files }: { files: string[] }) {
  const [selectedFile, setSelectedFile] = useState('')

  return (
    <section className="py-8" aria-label="音声比較デモ">
      <div className="flex flex-wrap items-center gap-3 py-4">
        <label htmlFor="comparison-file" className="font-bold">
          表示する音声
        </label>
        <select
          id="comparison-file"
          className="min-w-0 max-w-full rounded border border-neutral-400 bg-transparent px-2 py-1"
          value={selectedFile}
          onChange={(event) => setSelectedFile(event.target.value)}
        >
          <option value="">音声ファイルを選択してください</option>
          {files.map((file) => (
            <option key={file} value={file}>
              {file}
            </option>
          ))}
        </select>
      </div>
      {!selectedFile ? (
        <p className="text-sm text-neutral-600">
          音声を選択すると、スペクトル・音声・確率分布の比較デモを読み込みます。
        </p>
      ) : (
        <AudioComparisonDemo file={selectedFile} />
      )}
    </section>
  )
}
