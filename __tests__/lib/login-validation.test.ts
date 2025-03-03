import { test, expect, type Page } from '@playwright/test';

const BLUESKY_WEB_URL = "https://bsky.app/";
const BSKY_EMAIL = "cis565bskytests@gmail.com"; // TODO: Make these secret in GitHub
const BSKY_PASS = "CIS565TestGroup"; // TODO: Make these secret in GitHub


test.beforeEach(async ({ page }) => {
    await page.goto(BLUESKY_WEB_URL);
    await page.getByRole('button', {name: 'Sign in'}).click(); // Click Sign in button
});

test('Login Only Email Filled', {tag: '@login'}, async ({ page }) => {
    await page.getByTestId('loginUsernameInput').click(); // Click the username input field
    await page.getByTestId('loginUsernameInput').fill('test@gmail.com'); // Fill the username field
    await page.getByRole('button', {name: 'Next'}).click() // Click the next button to trigger a login attempt

    await expect(page.getByText('Please enter your password')).toHaveText('Please enter your password'); // Find the error message and then assert on it
});

test('Login Only Password Filled', {tag: '@login'}, async ({ page }) => {
    await page.getByTestId('loginPasswordInput').click(); // Click the password input field
    await page.getByTestId('loginPasswordInput').fill('password'); // Find the error message and then assert on it

    await page.getByRole('button', {name: 'Next'}).click() // Click the next button to trigger a login attempt

    await expect(page.getByText('Please enter your username')).toHaveText('Please enter your username'); // Find the error message and then assert on it
});

test('Login Bad Email Bad Password', {tag: '@login'}, async ({ page }) => {
    await page.getByTestId('loginUsernameInput').click(); // Click the username input field
    await page.getByTestId('loginUsernameInput').fill('test'); // Fill the username field

    await page.getByTestId('loginPasswordInput').click(); // Click the password input field
    await page.getByTestId('loginPasswordInput').fill('password'); // Find the error message and then assert on it

    await page.getByRole('button', {name: 'Next'}).click() // Click the next button to trigger a login attempt

    await expect(page.getByText('Incorrect username or password')).toHaveText('Incorrect username or password'); // Find the error message and then assert on it
});

test('Forgot Password Login', {tag: '@login'}, async ({ page }) => {
    await page.getByText('Forgot?').click(); // Click Forgot? button

    await expect(page.getByText('Enter the email you used to create your account. We\'ll send you a "reset code" so you can set a new password.')).toHaveText('Enter the email you used to create your account. We\'ll send you a "reset code" so you can set a new password.'); // Find the descriptor and assert on it
});

test('Successful Login', {tag: '@login'}, async ({ page }) => {
    await page.getByTestId('loginUsernameInput').click(); // Click the username input field
    await page.getByTestId('loginUsernameInput').fill(BSKY_EMAIL); // Fill the username field

    await page.getByTestId('loginPasswordInput').click(); // Click the password input field
    await page.getByTestId('loginPasswordInput').fill(BSKY_PASS); // Find the error message and then assert on it

    await page.getByRole('button', {name: 'Next'}).click() // Click the next button to trigger a login attempt

    await expect(page).toHaveURL('https://bsky.app/') // Check the URL after login
});
