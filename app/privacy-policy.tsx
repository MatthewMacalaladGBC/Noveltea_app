import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Divider, Text, useTheme } from 'react-native-paper';

const LAST_UPDATED = 'April 4, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Body({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="bodyMedium" style={[styles.body, { color: theme.colors.onSurface }]}>
      {children}
    </Text>
  );
}

export default function PrivacyPolicyScreen() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Privacy Policy" titleStyle={{ color: theme.colors.onBackground }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodySmall" style={[styles.updated, { color: theme.colors.onSurface }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        <Body>
          Welcome to Noveltea. We respect your privacy and are committed to protecting the personal
          information you share with us. This Privacy Policy explains how we collect, use, and
          safeguard your data when you use our app.
        </Body>

        <Divider style={styles.divider} />

        <Section title="1. Information We Collect">
          <Body>
            We collect the following types of information when you use Noveltea:{'\n\n'}
            • Account Information: Your username, email address, and password when you register.{'\n\n'}
            • Profile Information: Any bio, profile picture, or preferences you choose to add.{'\n\n'}
            • Usage Data: Information about how you interact with the app, such as books you add to
            your library, lists you create, reviews you write, and clubs you join.{'\n\n'}
            • Device Information: Basic device and app version information used to improve performance
            and fix bugs.
          </Body>
        </Section>

        <Section title="2. How We Use Your Information">
          <Body>
            We use the information we collect to:{'\n\n'}
            • Provide, operate, and maintain the Noveltea app.{'\n\n'}
            • Personalise your experience and remember your preferences.{'\n\n'}
            • Enable social features such as following other readers, joining book clubs, and sharing
            reviews.{'\n\n'}
            • Improve our app based on how users interact with it.{'\n\n'}
            • Communicate with you about account-related matters such as password changes or policy
            updates.{'\n\n'}
            We do not sell your personal data to third parties.
          </Body>
        </Section>

        <Section title="3. Data Sharing">
          <Body>
            We do not share your personal information with third parties except in the following
            circumstances:{'\n\n'}
            • With your consent.{'\n\n'}
            • To comply with legal obligations or respond to lawful requests from public authorities.{'\n\n'}
            • To protect the rights, property, or safety of Noveltea, our users, or others.{'\n\n'}
            Public profile information (username, bio, reviews, and reading lists marked as visible)
            may be visible to other users of the app.
          </Body>
        </Section>

        <Section title="4. Data Retention">
          <Body>
            We retain your personal data for as long as your account is active. If you delete your
            account, your personal information will be removed from our systems within 30 days,
            except where we are required to retain it for legal or compliance reasons.
          </Body>
        </Section>

        <Section title="5. Security">
          <Body>
            We take reasonable technical and organisational measures to protect your data from
            unauthorised access, disclosure, or loss. Passwords are stored using industry-standard
            hashing. However, no method of transmission or storage is 100% secure, and we cannot
            guarantee absolute security.
          </Body>
        </Section>

        <Section title="6. Children's Privacy">
          <Body>
            Noveltea is not directed at children under the age of 13. We do not knowingly collect
            personal information from children under 13. If we become aware that a child under 13
            has provided us with personal data, we will take steps to delete it promptly.{'\n\n'}
            Users aged 13–17 may use the app with parental consent. Certain mature content is
            restricted to users aged 18 and over.
          </Body>
        </Section>

        <Section title="7. Your Rights">
          <Body>
            Depending on where you live, you may have the right to:{'\n\n'}
            • Access the personal data we hold about you.{'\n\n'}
            • Request correction of inaccurate data.{'\n\n'}
            • Request deletion of your account and associated data.{'\n\n'}
            • Withdraw consent for data processing where applicable.{'\n\n'}
            To exercise any of these rights, please contact us at support@noveltea.app.
          </Body>
        </Section>

        <Section title="8. Changes to This Policy">
          <Body>
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes through the app or via email. Your continued use of Noveltea after any changes
            constitutes your acceptance of the updated policy.
          </Body>
        </Section>

        <Section title="9. Contact Us">
          <Body>
            If you have any questions or concerns about this Privacy Policy, please contact us at:{'\n\n'}
            Email: support@noveltea.app
          </Body>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48 },
  updated: { opacity: 0.5, marginBottom: 16 },
  divider: { marginVertical: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontWeight: '700', marginBottom: 8 },
  body: { lineHeight: 22, opacity: 0.85 },
});
