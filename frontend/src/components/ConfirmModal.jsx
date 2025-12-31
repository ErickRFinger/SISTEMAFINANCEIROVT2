import React from 'react';
import './ConfirmModal.css';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', isDangerous = false }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content confirm-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={isDangerous ? "btn-danger" : "btn-primary"}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
