"use client"

import { useEffect, useRef } from "react"
import Editor, { type Monaco } from "@monaco-editor/react"
import type { editor } from "monaco-editor"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  theme?: "vs-dark" | "vs-light"
}

export function CodeEditor({ value, onChange, language = "html", theme = "vs-light" }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor

    // Configure editor
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      wordWrap: "on",
      tabSize: 2,
      lineNumbers: "on",
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: 10,
      automaticLayout: true,
    })

    // Set up HTML intellisense
    if (language === "html") {
      monaco.languages.html.htmlDefaults.setOptions({
        format: {
          tabSize: 2,
          insertSpaces: true,
          wrapLineLength: 120,
          unformatted: "span,div",
          contentUnformatted: "pre,code",
          indentInnerHtml: true,
          preserveNewLines: true,
          maxPreserveNewLines: undefined,
          indentHandlebars: false,
          endWithNewline: false,
          extraLiners: "head,body,/html",
          wrapAttributes: "auto",
        },
      })
    }
  }

  // Handle value changes
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value)
    }
  }

  // Format document on command
  const formatDocument = () => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run()
    }
  }

  // Add keyboard shortcut for formatting
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Format on Alt+Shift+F or Cmd+Shift+F
      if ((e.altKey || e.metaKey) && e.shiftKey && e.key === "F") {
        e.preventDefault()
        formatDocument()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      theme={theme}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      options={{
        wordWrap: "on",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        tabSize: 2,
        lineNumbers: "on",
        glyphMargin: false,
        folding: true,
        lineDecorationsWidth: 10,
        automaticLayout: true,
      }}
    />
  )
}

