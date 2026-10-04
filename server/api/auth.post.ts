/**
 * POST /api/auth — авторизация клиента по дисконтной карте
 * Возвращает данные клиента INCLUDING discount percentage
 */

import { findClient } from '../utils/cloudshop'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cardNumber = body?.cardNumber

  if (!cardNumber) {
    throw createError({
      statusCode: 400,
      message: 'Не указан номер карты или телефона'
    })
  }

  try {
    const client = await findClient(cardNumber)

    if (!client) {
      throw createError({
        statusCode: 404,
        message: 'Клиент не найден'
      })
    }

    return {
      success: true,
      client: {
        id: client._id,
        name: client.name,
        phones: client.phones,
        emails: client.emails,
        discount: client.discount || 0,
        discountCard: client.discount_card,
        birthday: client.bday,
        sex: client.sex,
        enableSavings: client.enable_savings,
        loyaltyType: client.loyalty_type,
        debt: client.debt,
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: `Ошибка авторизации: ${error.message}`
    })
  }
})
