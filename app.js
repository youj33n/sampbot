const { VK, Keyboard } = require('vk-io') //загрузка библиотеки
const {connection, connects, MD5} = require('./mysql.js') //конфиги mysql
const players = require('./players.json')
const fs = require('fs')


//Подключение к API VK
const vk = new VK()
const TOKEN = '71b6c8c10766eb7a747892b1a277f12205cf4adf687eaca15851a3206fec948ca54d47ecdb1b1403e7dc8'
//'99f69f7ddd9759e3794978222b802154c3c1ee16a66c9e2cea8b0d52ca797a3ddb9293021f07764b28bd5'
//'71b6c8c10766eb7a747892b1a277f12205cf4adf687eaca15851a3206fec948ca54d47ecdb1b1403e7dc8'
vk.setOptions({ token: TOKEN, apiMode: 'parallel' }) //Подключаемся к VK API
//

//Подключение к MYSL и авторизация
connects(connection); // подключение MySQL


const L_NULL = 0, //не начал авторизацию
      L_PROCESS = 1,//в процессе авторизации
      L_ACTIVE = 2 //авторизовался
//
const utils = {
    gi: (int) => {
      int = int.toString();
      let text = ``;
      for (let i = 0; i < int.length; i++)
      {
        text += `${int[i]}&#8419;`;
      }
      return text;
    },
    random: (x, y) => {
      return y ? Math.round(Math.random() * (y - x)) + x : Math.round(Math.random() * x);
    },
    pick: (array) => {
      return array[utils.random(array.length - 1)];
        }
  }
setInterval(async () => {
    fs.writeFileSync("./players.json", JSON.stringify(players, null, "\t"))
}, 500);


const COLOR_BTN = { //Цвета кнопок
    green: Keyboard.POSITIVE_COLOR,
    blue: Keyboard.PRIMARY_COLOR,
    red: Keyboard.NEGATIVE_COLOR
}

const generalMenu = Keyboard.builder() //кнопка 'Меню'
const menu = Keyboard.builder()//Меню с аторизацией/промо
const menu2 = Keyboard.builder()//Меню с аторизацией/промо


//Резерв имени вводимых команд для поиска неподходящих
const messageIs = [
    'начать', 
    'привет',
    'авторизация',
    'меню',
    'статистика',
    'назад',
    'информация',
    'проверка',
    'выход с аккаунта'
]

vk.updates.on(['new_message'], async (next, context) => {
    if(players.filter(x => x.id === next.senderId)[0]) return context()
    players.push({
      id: next.senderId,
      name: ' ',
      password: ' '
    })
    return context()
  })

  

vk.updates.use(async (context, next) => { //прослушка сообщений
    if (!context.senderId) // Если отсуствует id отправителя - выйти
        return;
    if (context.senderId < 0) // Если сообщение не из лс с ботом - выйти
        return;
    if (context.isGroup) // Если сообщение от группы - выйти
        return;
    if (context.is('message') && context.isOutbox) // Если сообщение исходящее - выйти
        return;

    let player = players.filter(x => x.id === context.senderId)[0]
    if(player.status == L_PROCESS) {
            let text = ""
            if(context.text.search(' ')) //ищем пробелы и удаляем
                text = context.text.replace(/\s/g, '')
            else 
                text = context.text;//Если пробелов нет, оставляем нетронутым
                
            //let player = players.filter(x => x.id === context.senderId)[0]
            if(text.search(',')) {//Ищем запятую и делим на Name and Password
                let splitting = text.split(",")
                player.name = splitting[0]
                player.password = MD5(splitting[1]) //Если нет MD5, оставьте просто splitting[1]
                console.log(player.name, player.password)

            } else {
                context.send(`❌ Вводи логин и пароль через запятую (login, password)`)
                return
            } 

            connection.query('SELECT * FROM accounts WHERE NickName = ? AND Password = ?',[player.name, player.password], (err, results, fields) => {
                if(!results.length) { // Аккаунт не найден
                    player.status = L_NULL
                    return context.send({message: `❌Такой аккаунт не найден! Попробуйте снова`, keyboard: menu});
                }
                //Аккаунт найден
                player.name = results[0].NickName //NickName поле имени в таблице BD
                if(results[0].NickName == player.name) {
                    context.send({message: `✅Ты успешно авторизовался в аккаунте ${results[0].NickName}`, keyboard: menu2})
                    player.status = L_ACTIVE
                }
            })
    }//🚀✅
    
    if(messageIs.indexOf(context.text.toLowerCase()) != -1 ||  player.status == L_PROCESS ) 
        await next()
    else 
        context.send({message: `👀Я тебя не понимаю..\nВоспользуйся меню`, keyboard: generalMenu});
});

vk.updates.hear(/выход с аккаунта$/i, async msg => {
    let player = players.filter(x => x.id === msg.senderId)[0]
    player.status = L_NULL
    player.name = " "
    player.password = " "
    msg.send({message: `Вы вышли с аккаунта`, keyboard: menu});
})
vk.updates.hear(/статистика$/i, async msg => {
    let player = players.filter(x => x.id === msg.senderId)[0]
    if(player.status != L_ACTIVE) 
        return msg.send({message: `Сначала нужно авторизоваться!`, keyboard: menu});
    
    connection.query(
        'SELECT * FROM accounts WHERE NickName = ?',
        [player.name], 
        async (err, results, fields) => {

            const JOB_NAME = [
                "Безработный",
                "Водитель автобуса",
                "Детектив",
                "Развозчик продуктов",
                "Механик",
                "Таксист",
                "Адвокат",
                "Фермер",
                "Крупье",
                "Инкассатор",
                "Наркодиллер",
                "Дальнобойщик",
                "Развозчик пиццы",
                "Развозчик металлолома",
                "Мусорщик",
                "Грузчик",
                "Работник Налоговой",
                "Начинающий фермер",
                "Тракторист",
                "Комбайнер",
                "Водитель кукурузника",
                "Строитель"
            ]
            const FRAC_NAME = [
                "Гражданский",
                "Полиция LS",
                "RCPD",
                "FBI",
                "Полиция SF",
                "Больница LS",
                "Больница LV",
                "Правительство",
                "Армия LV",
                "Больница SF",
                "Лицензеры",
                "Radio LS",
                "Grove",
                "Vagos",
                "Ballas",
                "Aztecas",
                "Rifa",
                "Russian Mafia",
                "Yakuza",
                "La Cosa Nostra",
                "Warlock MC",
                "Армия LS",
                "Центральный Банк",
                "Полиция LV",
                "Radio LV",
                "Night Wolfs",
                "Radio SF",
                "Армия SF"
            ]
            if(results[0].NickName == player.name) {
                await msg.sendPhotos({ value: `https://sampik.ru/uploads/idskins/id${results[0].Skin}.png` })
                await msg.send({message: 
                `🚀Статистика ${player.name}:

                Уровень: ${results[0].Level}
                Опыт: ${results[0].Exp}/${(results[0].Level + 1) * 4}
                Номер телефона: ${results[0].TelNum}

                Работа: ${JOB_NAME[results[0].Job]}
                Наркотики: ${results[0].Drugs} гр.
                Материалы: ${results[0].Mats} шт.

                Организация: ${FRAC_NAME[results[0].Member]}

                `
                , keyboard: menu2});
                
                
                
        }
    });
});

vk.updates.hear(/^информация$/i, async msg => {
    await msg.send({message: 
    `Бот делает запрос в базу данных и выводит статистику игрока\nТак же есть возможность сделать настройки, покупка валюты.`, 
        keyboard: generalMenu});
});
vk.updates.hear(/^(?:начать|привет)$/i, async msg => {
    await msg.send({message: `Привет, ${await getName(msg.senderId)}!`, keyboard: generalMenu});
});
vk.updates.hear(/^назад$/i, async msg => {
    await msg.send({message: `Вы в главном меню`, keyboard: generalMenu});
});
vk.updates.hear(/^авторизация$/i, async msg => {
    let player = players.filter(x => x.id === msg.senderId)[0]
    if(player.status == L_ACTIVE) 
        return msg.send({message: `Ты уже авторизован!`, keyboard: menu2})

    await msg.send({message: `${await getName(msg.senderId)}\nДля авторизации введите логин и пароль через запятую:`})
    player.status = L_PROCESS
});
vk.updates.hear(/^меню$/i, async msg  => {
    await msg.send({message: `Для дальнейших действий выбери действие на кнопках:`, keyboard: menu});
});





menu2.oneTime()
    .textButton({
        label: `Выход с аккаунта`,
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

let getName = async (id) => {
    const response = await vk.api.users.get({
        user_ids: id
    });
    return response[0].first_name;
}

vk.updates.start(console.log('Бот запущен'));