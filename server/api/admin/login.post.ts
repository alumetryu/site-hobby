/**
 * POST /api/admin/login — авторизация админа
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { login, password } = body

  const ADMIN_LOGIN = process.env.ADMIN_LOGIN || ''
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

  if (login === ADMIN_LOGIN && password === ADMIN_PASSWORD) {
    // Генерируем простой токен (в реальном проекте лучше JWT)
    const token = Buffer.from(`${login}:${Date.now()}`).toString('base64')

    return {
      success: true,
      token,
      message: 'Авторизация успешна'
    }
  }

  throw createError({
    statusCode: 401,
    message: 'Неверный логин или пароль'
  })
})
