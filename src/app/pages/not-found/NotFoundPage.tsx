import { Link } from 'react-router-dom'
import { Button } from '@/shared/ui/kit'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-page-bg px-4 text-center">
      <p className="text-sm font-medium text-text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-text-main">
        Страница не найдена
      </h1>
      <p className="mt-2 max-w-md text-sm text-text-muted">
        Проверьте адрес или вернитесь на главную страницу.
      </p>
      <Button asChild className="mt-6 bg-brand hover:bg-brand-hover text-white">
        <Link to="/">На главную</Link>
      </Button>
    </div>
  )
}
