import { Body, Button, Container, Head, Heading, Html, Img, Preview, Section, Tailwind, Text } from '@react-email/components'

type Props = {
  username?: string
}

export default function AuroRideUpdatesEmail({ username = 'Customer' }: Props) {
  const previewText = `AuroRide updates for ${username}`
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 m-auto font-sans">
          <Container className="mb-10 mx-auto p-5 max-w-[465px] bg-white rounded-xl">
            <Section className="mt-6">
              <Img src="https://raw.githubusercontent.com/auroride/assets/main/logo.png" width="60" height="60" alt="AuroRide" className="my-0 mx-auto" />
            </Section>
            <Heading className="text-2xl text-gray-900 font-semibold text-center my-6">AuroRide Updates</Heading>
            <Text className="text-start text-sm text-gray-800">Hello {username},</Text>
            <Text className="text-start text-sm text-gray-700 leading-relaxed">
              Thanks for subscribing to AuroRide updates. We will send you route changes, delays, announcements, and special notices.
            </Text>
            <Section className="text-center mt-6 mb-6">
              <Button className="py-2.5 px-5 bg-pink-600 rounded-md text-white text-sm font-semibold no-underline" href="https://auroride.xyz">
                View Latest Updates
              </Button>
            </Section>
            <Text className="text-start text-sm text-gray-700">
              Safe travels,
              <br />
              The AuroRide Team
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
