import { VK } from 'vk-io';
import { connection, connects, MD5 } from './mysql.js' //конфиги mysql
import { generalMenu, menu } from './keyboard.js' //Кнопки

//Подключение к API VK
const vk = new VK()
const TOKEN = '71b6c8c10766eb7a747892b1a277f12205cf4adf687eaca15851a3206fec948ca54d47ecdb1b1403e7dc8'
vk.setOptions({ token: TOKEN, apiMode: 'parallel' }) //Подключаемся к VK API
//

//Подключение к MYSL и авторизация
connects(connection); // подключение MySQL
let player = {name: " ", password: " "} //Данные аккаунта в SAMP`e
let status_login//Статус Авторизации - Caps для видимости
const L_NULL = 0, //не начал авторизацию
      L_PROCESS = 1,//в процессе авторизации
      L_ACTIVE = 2 //авторизовался
//

//Резерв имени вводимых команд для поиска неподходящих
const messageIs = [
    'начать', 
    'привет',
    'авторизация',
    'меню',
    'статистика',
    'назад',
    'информация',
    'проверка'
]

vk.updates.use(async (context, next) => { //прослушка сообщений
    if (!context.senderId) // Если отсуствует id отправителя - выйти
        return;
    if (context.senderId < 0) // Если сообщение не из лс с ботом - выйти
        return;
    if (context.isGroup) // Если сообщение от группы - выйти
        return;
    if (context.is('message') && context.isOutbox) // Если сообщение исходящее - выйти
        return;

    if(status_login == L_PROCESS) {
            let text = ""
            if(context.text.search(' ')) //ищем пробелы и удаляем
                text = context.text.replace(/\s/g, '')
            else 
                text = ontext.text;//Если пробелов нет, оставляем нетронутым
                
            
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
                    status_login = L_NULL
                    return context.send({message: `❌Такой аккаунт не найден! Попробуйте снова`, keyboard: menu});
                }
                //Аккаунт найден
                player.name = results[0].NickName //NickName поле имени в таблице BD
                if(results[0].NickName == player.name) {
                    context.send({message: `✅Ты успешно авторизовался в аккаунте ${results[0].NickName}`, keyboard: menu})
                    status_login = L_ACTIVE
                }
            })
    }//🚀✅
    
    if(messageIs.indexOf(context.text.toLowerCase()) != -1 ||  status_login == L_PROCESS ) 
        await next()
    else 
        context.send({message: `👀Я тебя не понимаю..\nВоспользуйся меню`, keyboard: generalMenu});
});


vk.updates.hear(/статистика$/i, async msg => {
    if(status_login != L_ACTIVE) 
        return msg.send({message: `Сначала нужно авторизоваться!`, keyboard: menu});

    connection.query(
        'SELECT * FROM accounts WHERE NickName = ?',
        [player.name], 
        async (err, results, fields) => {

            const JOB_NAME = [
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

                Работа: ${JOB_NAME[results[0].Job+1]}
                Наркотики: ${results[0].Drugs} гр.
                Материалы: ${results[0].Mats} шт.

                Организация: ${FRAC_NAME[results[0].Member]}

                `
                , keyboard: menu});
                
                
                
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
    if(status_login == L_ACTIVE) 
        return msg.send({message: `Ты уже авторизован!`, keyboard: menu})

    await msg.send({message: `${await getName(msg.senderId)}\nДля авторизации введите логин и пароль через запятую:`})
    status_login = L_PROCESS
});
vk.updates.hear(/^меню$/i, async msg  => {
    await msg.send({message: `Для дальнейших действий выбери действие на кнопках:`, keyboard: menu});
});


let getName = async (id) => {
    const response = await vk.api.users.get({
        user_ids: id
    });
    return response[0].first_name;
}

vk.updates.start(console.log('Бот запущен'));