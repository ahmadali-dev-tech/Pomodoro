import Modal from './Modal'
import Button from './Button'

/** Confirmation for destructive or hard-to-undo actions. */
export default function ConfirmDialog({
  open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  destructive = false, loading = false, onConfirm, onCancel, children,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={(
        <>
          <Button variant="ghost" onClick={onCancel} data-autofocus>{cancelLabel}</Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      )}
    >
      {children}
    </Modal>
  )
}
