import { MainLayout } from '@/app/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/kit'

export function AboutServicePage() {
  return (
    <MainLayout>
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="text-text-main">О сервисе</CardTitle>
          <p className="text-sm text-text-muted">
            Тонна-СНГ — это площадка для честных сделок с зерном.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-text-main">
          <p>
            Реальные участники рынка, прозрачные условия и никаких лишних
            посредников.
          </p>
          <p>
            Вы видите автора заявки и работаете напрямую.
          </p>
        </CardContent>
      </Card>
    </MainLayout>
  )
}
