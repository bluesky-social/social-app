# Hello Friends!
# If you are considering bulk or automated crawling, you may want to look in
# to our protocol (API), including a firehose of updates. See: https://atproto.com/

# By default, may crawl anything on this domain. HTTP 429 ("backoff") status
# codes are used for rate-limiting. Up to a handful concurrent requests should
# be ok.
User-Agent: *
Allow: /
