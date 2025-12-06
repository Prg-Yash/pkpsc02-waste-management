import * as React from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
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

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");

  const onGoogleSignIn = React.useCallback(async () => {
    try {
      const { createdSessionId, setActive: oAuthSetActive } =
        await startOAuthFlow();

      if (createdSessionId) {
        await oAuthSetActive!({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Google sign-in failed");
      console.error("OAuth error", err);
    }
  }, []);

  const onSignInPress = async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/(tabs)");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setError("Sign in failed. Please try again.");
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Invalid email or password");
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
            <YStack space="$2" alignItems="center">
              <H2 color="$green10" textAlign="center">
                Welcome Back
              </H2>
              <Text color="$gray11" textAlign="center">
                Sign in to continue
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
                placeholder="Enter your password"
                secureTextEntry={true}
                onChangeText={(password: string) => {
                  setPassword(password);
                  setError("");
                }}
              />
            </YStack>

            <Button
              backgroundColor="$green10"
              color="white"
              onPress={onSignInPress}
              disabled={!emailAddress || !password}
              opacity={!emailAddress || !password ? 0.5 : 1}
              pressStyle={{ opacity: 0.8 }}
            >
              Sign In
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
              onPress={onGoogleSignIn}
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
              <Text color="$gray11">Don't have an account?</Text>
              <Link href="/(auth)/sign-up" asChild>
                <Text color="$green10" fontWeight="bold">
                  Sign Up
                </Text>
              </Link>
            </XStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Theme>
  );
}
