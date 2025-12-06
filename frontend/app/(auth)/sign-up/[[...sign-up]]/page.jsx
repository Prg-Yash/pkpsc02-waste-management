import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 
              'bg-indigo-600 hover:bg-indigo-700 text-sm normal-case',
            card: 'shadow-lg',
            headerTitle: 'text-2xl font-bold',
            headerSubtitle: 'text-gray-600',
            socialButtonsBlockButton: 
              'border-gray-300 hover:bg-gray-50',
            formFieldLabel: 'text-gray-700 font-medium',
            formFieldInput: 
              'rounded-lg border-gray-300 focus:ring-indigo-500',
            footerActionLink: 
              'text-indigo-600 hover:text-indigo-700 font-medium',
          },
        }}
        forceRedirectUrl="/dashboard"
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
      />
    </div>
  );
}
