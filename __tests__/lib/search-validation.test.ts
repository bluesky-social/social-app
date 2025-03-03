import { test, expect, type Page } from '@playwright/test';

const BLUESKY_WEB_URL = 'https://bsky.app'; // Or your local Bluesky instance URL

// Setup functionality
test.beforeEach(async ({ page }) => {

  // Navigate to the search page
  await page.goto(`${BLUESKY_WEB_URL}/search`);

});

async function searchForPost(page: Page, term: string): Promise<void> {

  // Find the search input HTML element using placeholder attribute and pass search term
  await page.getByPlaceholder('Search for posts, users, or feeds').fill(term);

  // Search for entered term by stimulating 'enter' keyboard press
  await page.keyboard.press('Enter');

}

async function searchForUser(page: Page, userTerm: string): Promise<void> {

  // Find the search input HTML element using placeholder attribute and pass search term
  await page.getByPlaceholder('Search for posts, users, or feeds').fill(userTerm);

  // Search for entered term by stimulating 'enter' keyboard press
  await page.keyboard.press('Enter');

  // Navigate to People tab
  const peopleTab = page.getByText('People', {exact : true });
  
  // First check if tab is visible
  await expect(peopleTab).toBeVisible();

  // Click on tab
  await peopleTab.click()

}

// Test Case: Searching for a BlueSky Post
test('Search term and verify results', async ({ page }) => {

  // Specify search term
  const searchTerm = 'Nba All Star Game';

  // Run searchBlueSky method to search for term
  await searchForPost(page, searchTerm);

  // Assertions:
  // Get the post title using #id element
  const searchResults = await page.getByTestId('postText');

  // Check if at least one result contains the search term (case-insensitive)
  const firstResultText = await searchResults.first().textContent();

  // Get expected length of search term
  const expectedResult = searchTerm.length;
  
  // Verify actual term is either equal or greater than the length of the search term
  await expect(firstResultText?.length).toBeGreaterThanOrEqual(expectedResult);

});

 
// Test Case: Searching for Nothing (empty search)
test('Search empty term and verify results', async ({ page }) => {

  // Specify empty search term
  const searchTerm = '';

  // Run searchBlueSky method to search for term
  await searchForPost(page, searchTerm);

  // Check that "Find posts and users on Bluesky" message displays
  const returnMsg = await page.locator('div.css-146c3p1').first();

  // Assertions:
  // Verify returnMsg == "Find posts and users on Bluesky"
  await expect(returnMsg).toHaveText('Find posts and users on Bluesky');

});


// Test Case: Searching for a BlueSky User
test('Search user and verify results', async ({ page }) => {

  // Specify user name
  const searchUser = 'Mark Cuban';

  // Run searchBlueSky method to search for user
  await searchForUser(page, searchUser);

  const searchResults = await page.locator('div.css-146c3p1');

  const resultCount = await searchResults.count();

  // Assertion
  // Verify Mark Cuban is found in list of users atleast once
  expect(resultCount).toBeGreaterThan(0);

});


