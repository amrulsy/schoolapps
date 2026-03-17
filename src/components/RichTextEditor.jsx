import { useState, useRef, useMemo } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useApp } from '../context/AppContext'
import MediaLibraryModal from './MediaLibraryModal'

const API_BASE = 'http://localhost:3000/api/admin/cms'

export default function RichTextEditor({ value, onChange, placeholder }) {
    const { addToast } = useApp()
    const quillRef = useRef()
    const [showMediaModal, setShowMediaModal] = useState(false)

    // Custom image handler that opens our MediaLibraryModal
    const imageHandler = () => {
        setShowMediaModal(true)
    }

    // Insert selected image into editor
    const handleMediaSelect = (url) => {
        const editor = quillRef.current.getEditor()
        const range = editor.getSelection()
        const index = range ? range.index : editor.getLength()
        editor.insertEmbed(index, 'image', url)
        editor.setSelection(index + 1)
        setShowMediaModal(false)
    }

    // Custom toolbar modules
    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['link', 'image', 'video'],
                ['clean']
            ],
            handlers: {
                image: imageHandler
            }
        }
    }), [])

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'align',
        'link', 'image', 'video'
    ]

    return (
        <div className="rich-text-editor-container">
            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder || 'Tulis konten di sini...'}
                style={{ height: '400px', marginBottom: '50px' }}
            />

            <MediaLibraryModal
                isOpen={showMediaModal}
                onClose={() => setShowMediaModal(false)}
                onSelect={handleMediaSelect}
            />

            <style>{`
                .rich-text-editor-container .ql-editor {
                    font-size: 1rem;
                    line-height: 1.6;
                    font-family: inherit;
                }
                .rich-text-editor-container .ql-container {
                    border-bottom-left-radius: 6px;
                    border-bottom-right-radius: 6px;
                }
                .rich-text-editor-container .ql-toolbar {
                    border-top-left-radius: 6px;
                    border-top-right-radius: 6px;
                    background: #f8fafc;
                }
            `}</style>
        </div>
    )
}
