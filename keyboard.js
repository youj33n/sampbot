
import { Keyboard } from 'vk-io'


export const COLOR_BTN = { //Цвета кнопок
    green: Keyboard.POSITIVE_COLOR,
    blue: Keyboard.PRIMARY_COLOR,
    red: Keyboard.NEGATIVE_COLOR
}

export const generalMenu = Keyboard.builder() //кнопка 'Меню'
export const menu = Keyboard.builder()//Меню с аторизацией/промо
    

menu.oneTime()
    .textButton({
        label: `Авторизация`,
        color: COLOR_BTN.green
    })
    .textButton({
        label: `Статистика`,
        color: COLOR_BTN.blue
    })
    .row()
    .textButton({
        label: `Назад`,
        color: COLOR_BTN.red
    })
    .row()


generalMenu.oneTime()
    .textButton({
		label: `Меню`,
		color: COLOR_BTN.green
	})
    .textButton({
		label: `Информация`,
		color: COLOR_BTN.blue
	})
    .row()

    


