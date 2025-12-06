import { Link } from "expo-router";
import { YStack, Text, Theme, H2 } from "tamagui";

export default function ModalScreen() {
  return (
    <Theme name="light">
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding="$4"
        backgroundColor="$background"
      >
        <H2>This is a modal</H2>
        <Link href="/" dismissTo>
          <Text color="$blue10" marginTop="$4" paddingVertical="$3">
            Go to home screen
          </Text>
        </Link>
      </YStack>
    </Theme>
  );
}
