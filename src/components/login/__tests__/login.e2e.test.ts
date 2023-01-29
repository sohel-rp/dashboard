import puppeteer from 'puppeteer-core'

function delay(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout)
    })
}

describe('Login', () => {
    let browser
    let page

    beforeAll(async () => {
        browser = await puppeteer.launch({ channel: 'chrome', headless: false })
        page = await browser.newPage()
        await page.setViewport({width: 1200, height: 720})
    })

    it('Login as admin flow', async () => {
        await delay(3000)
        await page.goto('<dashboard_login_url>', { waitUntil: 'networkidle0' })
        await page.waitForSelector('.login__link')
        const text = await page.$eval('.login__link', (e) => e.textContent)
        expect(text).toContain('Login as administrator')
        await page.screenshot({
            fullPage: true,
            path: '<path>/login.png',
            type: 'png'
        })
        await page.click('.login__link')
        // await page.waitForSelector('input[name="username"]'),
        await page.waitForSelector('input[name="password"]')
        // await page.type('input[name="username"]', 'admin'),
        await page.type('input[name="password"]', '<admin_password>')
        await page.screenshot({
            fullPage: true,
            path: '<path>/loginAsAdmin.png',
            type: 'png'
        })
        await Promise.all([page.click('.cta.login__button'), page.waitForNavigation({ waitUntil: 'networkidle0' })])

        await delay(3000)

        await page.waitForSelector('.dc__page-header__title')
        const title = await page.$eval('.dc__page-header__title span.fw-6', (e) => e.textContent)
        expect(title).toContain('Applications')
        await page.screenshot({
            fullPage: true,
            path: '<path>/AppList.png',
            type: 'png'
        })
    }, 30000)

    afterAll(async () => {
        await delay(3000)
        await browser.close()
    })
})
