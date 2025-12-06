import * as React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  Button,
  Input,
  Label,
  ScrollView,
  Text,
  YStack,
  XStack,
  H2,
  Separator,
  Theme,
} from "tamagui";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState("");

  const onGoogleSignUp = React.useCallback(async () => {
    try {
      const { createdSessionId, setActive: oAuthSetActive } =
        await startOAuthFlow();

      if (createdSessionId) {
        await oAuthSetActive!({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Google sign-up failed");
      console.error("OAuth error", err);
    }
  }, []);

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setError("");
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Sign up failed. Please try again.");
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
        setError("Verification failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid verification code");
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <Theme name="light">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 20,
          }}
          backgroundColor="$background"
        >
          <YStack
            backgroundColor="white"
            borderRadius="$4"
            padding="$5"
            elevation="$4"
            space="$4"
            shadowColor="$shadowColor"
            shadowRadius={10}
            shadowOpacity={0.1}
          >
            {pendingVerification ? (
              <>
                <YStack space="$2" alignItems="center">
                  <H2 color="$green10" textAlign="center">
                    Verify Email
                  </H2>
                  <Text color="$gray11" textAlign="center">
                    Enter the verification code sent to {emailAddress}
                  </Text>
                </YStack>

                {error ? (
                  <Text
                    color="$red10"
                    textAlign="center"
                    backgroundColor="$red2"
                    padding="$2"
                    borderRadius="$2"
                  >
                    {error}
                  </Text>
                ) : null}

                <YStack space="$2">
                  <Label>Verification Code</Label>
                  <Input
                    value={code}
                    placeholder="Enter 6-digit code"
                    onChangeText={(code: string) => {
                      setCode(code);
                      setError("");
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </YStack>

                <Button
                  backgroundColor="$green10"
                  color="white"
                  onPress={onVerifyPress}
                  disabled={code.length !== 6}
                  opacity={code.length !== 6 ? 0.5 : 1}
                >
                  Verify & Continue
                </Button>

                <Button
                  chromeless
                  color="$green10"
                  onPress={() => setPendingVerification(false)}
                >
                  Back to Sign Up
                </Button>
              </>
            ) : (
              <>
                <YStack space="$2" alignItems="center">
                  <H2 color="$green10" textAlign="center">
                    Create Account
                  </H2>
                  <Text color="$gray11" textAlign="center">
                    Join us in making waste management easier
                  </Text>
                </YStack>

                {error ? (
                  <Text
                    color="$red10"
                    textAlign="center"
                    backgroundColor="$red2"
                    padding="$2"
                    borderRadius="$2"
                  >
                    {error}
                  </Text>
                ) : null}

                <YStack space="$2">
                  <Label>Email</Label>
                  <Input
                    autoCapitalize="none"
                    value={emailAddress}
                    placeholder="Enter your email"
                    onChangeText={(email: string) => {
                      setEmailAddress(email);
                      setError("");
                    }}
                    keyboardType="email-address"
                  />
                </YStack>

                <YStack space="$2">
                  <Label>Password</Label>
                  <Input
                    value={password}
                    placeholder="Create a password"
                    secureTextEntry={true}
                    onChangeText={(password: string) => {
                      setPassword(password);
                      setError("");
                    }}
                  />
                  <Text fontSize="$2" color="$gray9">
                    Minimum 8 characters
                  </Text>
                </YStack>

                <Button
                  backgroundColor="$green10"
                  color="white"
                  onPress={onSignUpPress}
                  disabled={!emailAddress || !password}
                  opacity={!emailAddress || !password ? 0.5 : 1}
                >
                  Sign Up
                </Button>

                <XStack alignItems="center" space="$3">
                  <Separator />
                  <Text color="$gray10">OR</Text>
                  <Separator />
                </XStack>

                <Button
                  backgroundColor="white"
                  borderColor="$gray5"
                  borderWidth={1}
                  onPress={onGoogleSignUp}
                  color="$gray12"
                  icon={
                    <Text color="$blue10" fontWeight="bold">
                      G
                    </Text>
                  }
                >
                  Continue with Google
                </Button>

                <XStack justifyContent="center" space="$2">
                  <Text color="$gray11">Already have an account?</Text>
                  <Link href="/(auth)/sign-in" asChild>
                    <Text color="$green10" fontWeight="bold">
                      Sign In
                    </Text>
                  </Link>
                </XStack>
              </>
            )}
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Theme>
  );
}
