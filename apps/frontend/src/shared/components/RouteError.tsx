import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { Card, CardBody, InlineNotice, SealMark } from '@pramana/ui-components';
import { ROUTES } from '@/shared/constants/routes';

function ErrorScreen({ notFound }: { notFound: boolean }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <SealMark size={44} />
        <h1 className="text-title-lg">{notFound ? 'Page not found' : 'Something went wrong'}</h1>
      </div>
      <Card>
        <CardBody className="flex flex-col gap-4">
          <InlineNotice
            tone={notFound ? 'neutral' : 'amber'}
            title={notFound ? 'No such page' : 'This screen failed to load'}
            role="alert"
          >
            {notFound
              ? 'Check the address, or go back and choose a portal.'
              : 'Reload the page. If it keeps failing, the API or a network dependency is unreachable.'}
          </InlineNotice>
          <Link to={ROUTES.home} className="text-body-sm font-medium underline underline-offset-4">
            Back to the portals
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}

/**
 * Root errorElement: a render or loader failure in any portal lands here
 * instead of a blank page.
 */
export function RouteError() {
  const error = useRouteError();
  return <ErrorScreen notFound={isRouteErrorResponse(error) && error.status === 404} />;
}

/** Catch-all for URLs that match no portal route. */
export function NotFoundPage() {
  return <ErrorScreen notFound />;
}
