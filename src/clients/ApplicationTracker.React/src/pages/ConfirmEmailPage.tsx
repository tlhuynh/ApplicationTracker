import {useEffect, useRef, useState} from 'react';
import {Link, useSearchParams} from 'react-router';
import {confirmEmail} from '@/api/auth';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const userId = searchParams.get('userId');
  const token = searchParams.get('token');
  const isMissingParams = !userId || !token;

  const hasCalledRef = useRef(false);
  useEffect(() => {
    if (isMissingParams) return;
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    confirmEmail({ userId, token })
      .then((result) => {
        setStatus('success');
        setMessage(result);
      })
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Email confirmation failed');
      });
  }, [userId, token, isMissingParams]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Confirming your email...'}
            {status === 'success' && 'Email confirmed'}
            {status === 'error' && 'Confirmation failed'}
          </CardTitle>
          {message && <CardDescription>{message}</CardDescription>}
        </CardHeader>
        {status !== 'loading' && (
          <CardContent>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Go to Login
              </Button>
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
