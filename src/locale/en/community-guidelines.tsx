import React from 'react'
import {H3, H4, P, UL, LI, A, EM, OL} from 'view/com/util/Html'

export default function () {
  return (
    <>
      <H4>Last Updated:&nbsp;April 6, 2023</H4>
      <P>
        The Bluesky app is built on a decentralized social networking protocol,
        the AT Protocol (atproto). Atproto is an open protocol that supports
        many different kinds of services. Our mission for the Bluesky app is to
        foster a vibrant and evolving community that respects individual
        preferences and adapts to the changing needs of our users. With this in
        mind, we have established the following goals for our community
        guidelines:
      </P>
      <OL>
        <LI>
          Empower user choice: We strive to provide users with the ability to
          select self-governing services on the AT protocol that align with
          their personal preferences and values. This includes making it easy
          for others to run their own services, and for users to migrate between
          services.
        </LI>
        <LI>
          Cultivate a welcoming environment: Our aim is to create a safe and
          friendly space on bsky.social, the server we run, where new users feel
          welcome and supported, and where we ourselves enjoy participating. To
          help achieve this vision, we have implemented moderation systems
          guided by the following policies.
        </LI>
        <LI>
          Maintain up-to-date guidelines: As our user base grows and changes,
          our community guidelines must evolve as well. We will regularly review
          and update these guidelines in response to feedback from our users,
          emerging trends, and changing circumstances, and will strive to
          maintain transparency about any changes to our policies.
        </LI>
      </OL>
      <P>
        In the following sections, we will dive into the specific policies that
        make up our server and community guidelines.
      </P>
      <H3>Server Guidelines</H3>
      <P>
        Our server guidelines outline the content policies we have established
        for the material hosted on our infrastructure at bsky.social. These
        policies have been selected to minimize potential risks and costs
        associated with hosting certain types of content, since we have limited
        developer resources and want to focus them on improving the AT Protocol.
      </P>
      <P>
        It is important to note that other servers within the atproto network
        may have different server-level rules. If you find that our policies do
        not align with your preferences, we encourage you to explore alternative
        servers or create your own. If you initially choose to use bsky.social
        but later decide that our policies do not suit your needs, you will soon
        be able to seamlessly migrate your account between servers.
      </P>
      <P>
        <EM>No illegal content or transactions</EM>
      </P>
      <UL>
        <LI>
          Don&rsquo;t share, promote, or engage in any illegal activities or
          transactions on our platform. This includes, but is not limited to,
          sharing copyrighted material without permission, distributing illicit
          substances, or participating in any form of illegal trade.
        </LI>
      </UL>
      <P>
        <EM>Don&rsquo;t break our infrastructure</EM>
      </P>
      <UL>
        <LI>
          If you find a vulnerability, please report it to us at
          support@bsky.app, and don&rsquo;t use it to exploit or take down our
          infrastructure.
        </LI>
      </UL>
      <H3>Community Guidelines</H3>
      <P>
        Our community guidelines are designed to promote a safe and enjoyable
        experience for all users on our server. These policies serve as an
        additional layer on top of our server-level guidelines and are intended
        to foster a positive and respectful environment. For some community
        guidelines, we plan to offer content filters that you can adjust
        according to your preferences, allowing you to view content that has
        been initially filtered out. Please be aware that these rules will
        evolve over time as we continually work to cultivate a healthy and
        thriving community.
      </P>
      <P>
        <EM>Be polite and respectful</EM>
      </P>
      <UL>
        <LI>
          Don&rsquo;t harass, use slurs, threaten violence, or attack people
        </LI>
      </UL>
      <P>
        <EM>Don&rsquo;t spam</EM>
      </P>
      <UL>
        <LI>
          Don&rsquo;t repeatedly post the same message, or excessively promote
          anything
        </LI>
      </UL>
      <P>
        <EM>Don&rsquo;t abuse the reporting system</EM>
      </P>
      <UL>
        <LI>
          Don&rsquo;t use the reporting tool to spam, harass users, or submit
          unfounded or trivial complaints. The reporting system is in place to
          address genuine concerns and maintain the safety and integrity of our
          community, so please use it responsibly.
        </LI>
      </UL>
      <H3>Enforcement</H3>
      <P>
        Our goal is to provide a flexible environment that balances the freedom
        and safety of our users. Violations of server or community guidelines
        may result in a flag, a warning, an account suspension until you migrate
        away from our service, or a permanent account suspension and ban from
        our services.{' '}
      </P>
      <P>References:</P>
      <P>
        Twitter:{' '}
        <A href="https://help.twitter.com/en/rules-and-policies/twitter-rules">
          https://help.twitter.com/en/rules-and-policies/twitter-rules
        </A>
      </P>
      <P>
        Reddit:{' '}
        <A href="https://www.redditinc.com/policies/content-policy">
          https://www.redditinc.com/policies/content-policy
        </A>
      </P>
      <P>
        Discord:{' '}
        <A href="https://discord.com/guidelines">
          https://discord.com/guidelines
        </A>
      </P>
      <P>
        Discord TOS:{' '}
        <A href="https://discord.com/terms">https://discord.com/terms</A>
      </P>
    </>
  )
}
