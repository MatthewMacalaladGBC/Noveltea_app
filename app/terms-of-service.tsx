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

export default function TermsOfServiceScreen() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Terms of Service" titleStyle={{ color: theme.colors.onBackground }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="bodySmall" style={[styles.updated, { color: theme.colors.onSurface }]}>
          Last updated: {LAST_UPDATED}
        </Text>

        <Body>
          Please read these Terms of Service carefully before using Noveltea. By creating an account
          or using the app, you agree to be bound by these terms.
        </Body>

        <Divider style={styles.divider} />

        <Section title="1. Acceptance of Terms">
          <Body>
            By accessing or using Noveltea, you confirm that you are at least 13 years of age and
            agree to these Terms of Service and our Privacy Policy. If you do not agree, please do
            not use the app.
          </Body>
        </Section>

        <Section title="2. Your Account">
          <Body>
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activity that occurs under your account. You agree to:{'\n\n'}
            • Provide accurate and up-to-date information when registering.{'\n\n'}
            • Notify us immediately of any unauthorised access to your account.{'\n\n'}
            • Not share your login credentials with others.{'\n\n'}
            We reserve the right to suspend or terminate accounts that violate these terms.
          </Body>
        </Section>

        <Section title="3. Acceptable Use">
          <Body>
            You agree not to use Noveltea to:{'\n\n'}
            • Post content that is abusive, hateful, threatening, or harassing.{'\n\n'}
            • Impersonate another person or misrepresent your affiliation with any entity.{'\n\n'}
            • Upload or share content that infringes on the intellectual property rights of others.{'\n\n'}
            • Attempt to gain unauthorised access to our systems or other users' accounts.{'\n\n'}
            • Use the app for any unlawful purpose or in violation of any applicable laws.{'\n\n'}
            We reserve the right to remove content or accounts that violate these rules without notice.
          </Body>
        </Section>

        <Section title="4. User Content">
          <Body>
            When you submit reviews, lists, comments, or other content on Noveltea, you retain
            ownership of that content. However, you grant us a non-exclusive, royalty-free,
            worldwide licence to display and share that content within the app.{'\n\n'}
            You are solely responsible for the content you post. We do not endorse or take
            responsibility for any user-generated content.
          </Body>
        </Section>

        <Section title="5. Book Club Rules">
          <Body>
            Book club owners and moderators are responsible for managing their clubs in accordance
            with these terms. Clubs that promote hate speech, harassment, or illegal activity will
            be removed. Members who violate club rules or these terms may be removed by moderators
            or by Noveltea.
          </Body>
        </Section>

        <Section title="6. Intellectual Property">
          <Body>
            All content, design, logos, and code associated with Noveltea are the property of
            Noveltea and its licensors. You may not reproduce, distribute, or create derivative
            works from our content without express written permission.{'\n\n'}
            Book cover images and metadata are sourced from OpenLibrary and are subject to their
            respective licences.
          </Body>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <Body>
            Noveltea is provided on an "as is" and "as available" basis without warranties of any
            kind, either express or implied. We do not guarantee that the app will be uninterrupted,
            error-free, or free of viruses or other harmful components.
          </Body>
        </Section>

        <Section title="8. Limitation of Liability">
          <Body>
            To the fullest extent permitted by law, Noveltea shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising from your use of the
            app or inability to access the app.
          </Body>
        </Section>

        <Section title="9. Changes to Terms">
          <Body>
            We may update these Terms of Service at any time. We will notify you of significant
            changes through the app or via email. Your continued use of Noveltea after any changes
            constitutes your acceptance of the updated terms.
          </Body>
        </Section>

        <Section title="10. Governing Law">
          <Body>
            These terms are governed by and construed in accordance with applicable law. Any
            disputes arising from these terms or your use of the app will be subject to the
            exclusive jurisdiction of the relevant courts.
          </Body>
        </Section>

        <Section title="11. Contact Us">
          <Body>
            If you have questions about these Terms of Service, please contact us at:{'\n\n'}
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
