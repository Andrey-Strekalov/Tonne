import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBid } from '@/shared/api/bids'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea } from '@/shared/ui/kit'
import {
  EBidType,
  type TCreateBidForm,
  type TCreateBidRequest,
  type TCreateBidResponse,
} from '@/shared/types'

type TCreateBidProps = {
  open: boolean
  onClose: () => void
}

const initialCreateBidForm: TCreateBidForm = {
  type: EBidType.Sell,
  title: '',
  quality: '',
  price: '',
  volume: '',
  region: '',
  comment: '',
}

export function CreateBid({ open, onClose }: TCreateBidProps) {
  const [formState, setFormState] = useState<TCreateBidForm>(initialCreateBidForm)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { mutate: submitBid, isPending } = useMutation({
    mutationFn: (payload: TCreateBidRequest) => createBid(payload),
    onSuccess: async (response: TCreateBidResponse) => {
      if (response.success) {
        await queryClient.invalidateQueries({ queryKey: ['bids'] })
        handleClose()
        return
      }

      setSubmitError(response.message ?? 'Не удалось создать заявку. Попробуйте еще раз.')
    },
    onError: (error: Error) => {
      setSubmitError(error.message)
    },
  })

  const handleFieldChange = (field: keyof TCreateBidForm, value: string) => {
    setFormState((prevState) => ({
      ...prevState,
      [field]: value,
    }))
  }

  const handleCommentChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    handleFieldChange('comment', event.target.value)
  }

  const handleClose = () => {
    setFormState(initialCreateBidForm)
    setSubmitError(null)
    onClose()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)

    const quality = formState.quality.trim()
    const comment = formState.comment.trim()

    const payload: TCreateBidRequest = {
      type: formState.type,
      title: formState.title.trim(),
      price: formState.price.trim(),
      volume: formState.volume.trim(),
      region: formState.region.trim(),
      ...(quality && { quality }),
      ...(comment && { comment }),
    }

    submitBid(payload)
  }

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[var(--gk-ink)]/30 px-4 py-6 backdrop-blur-sm sm:items-center sm:px-6"
      onClick={handleClose}
    >
      <Card className="flex w-full max-w-xl max-h-[calc(100vh-3rem)] flex-col [box-shadow:var(--gk-shadow-lg)]" onClick={(event) => { event.stopPropagation(); }}>
        <CardHeader className="shrink-0 space-y-1.5">
          <CardTitle className="text-ink">Создать заявку</CardTitle>
          <p className="text-sm text-[var(--gk-fg-muted)]">
            Заполните параметры продажи или покупки: укажите культуру, объём,
            цену и место. После создания заявка появится в общем списке.
          </p>
        </CardHeader>

        <CardContent className="min-h-0 overflow-y-auto">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="text-ink">Тип заявки</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formState.type === EBidType.Sell ? 'accent' : 'outline'}
                  onClick={() => { handleFieldChange('type', EBidType.Sell); }}
                >
                  Продажа
                </Button>
                <Button
                  type="button"
                  variant={formState.type === EBidType.Buy ? 'accent' : 'outline'}
                  onClick={() => { handleFieldChange('type', EBidType.Buy); }}
                >
                  Покупка
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bid-title" className="text-ink">
                  Название культуры
                </Label>
                <Input
                  id="bid-title"
                  value={formState.title}
                  onChange={(event) => { handleFieldChange('title', event.target.value); }}
                  placeholder="Например, Пшеница 4 класс"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bid-quality" className="text-ink">
                  Качество
                </Label>
                <Input
                  id="bid-quality"
                  value={formState.quality}
                  onChange={(event) => { handleFieldChange('quality', event.target.value); }}
                  placeholder="Например, Протеин 12.5%, ГОСТ"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bid-price" className="text-ink">
                  Цена за 1 кг
                </Label>
                <Input
                  id="bid-price"
                  value={formState.price}
                  onChange={(event) => { handleFieldChange('price', event.target.value); }}
                  placeholder="15,4 ₽/кг"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bid-volume" className="text-ink">
                  Объём в тоннах
                </Label>
                <Input
                  id="bid-volume"
                  value={formState.volume}
                  onChange={(event) => { handleFieldChange('volume', event.target.value); }}
                  placeholder="300 т"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bid-region" className="text-ink">
                  Регион
                </Label>
                <Input
                  id="bid-region"
                  value={formState.region}
                  onChange={(event) => { handleFieldChange('region', event.target.value); }}
                  placeholder="Ростовская область"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bid-comment" className="text-ink">
                  Комментарий
                </Label>
                <Textarea
                  id="bid-comment"
                  value={formState.comment}
                  onChange={handleCommentChange}
                  placeholder="Например: самовывоз, торг уместен, возможна отсрочка оплаты"
                  rows={4}
                />
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-red-600">{submitError}</p>
            )}

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                Отмена
              </Button>
              <Button type="submit" variant="accent" disabled={isPending}>
                {isPending ? 'Создаём...' : 'Создать заявку'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
