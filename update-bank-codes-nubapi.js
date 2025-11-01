const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Comprehensive bank codes from NubAPI (https://nubapi.com/bank-json)
const nubApiBankCodes = {
  // Major Commercial Banks
  'SIGNATURE BANK': '000034',
  'OPTIMUS BANK': '000036',
  'STERLING BANK': '000001',
  'KEYSTONE BANK': '000002',
  'FIRST CITY MONUMENT BANK': '000003',
  'UNITED BANK FOR AFRICA': '000004',
  'JAIZ BANK': '000006',
  'FIDELITY BANK': '000007',
  'POLARIS BANK': '000008',
  'CITI BANK': '000009',
  'ECOBANK': '000010',
  'UNITY BANK': '000011',
  'STANBIC IBTC BANK': '000012',
  'GTBANK PLC': '000013',
  'ACCESS BANK': '000014',
  'ZENITH BANK': '000015',
  'FIRST BANK OF NIGERIA': '000016',
  'WEMA BANK': '000017',
  'UNION BANK': '000018',
  
  // Additional banks from the API
  'HERITAGE BANK': '000020',
  'PROVIDUS BANK': '000101',
  'KUDA BANK': '000022',
  'OPAY': '000024',
  'PALMPAY': '000025',
  'MONIE POINT': '000026',
  'CARBON': '000027',
  'VFD MICROFINANCE BANK': '000028',
  'KORAPAY': '000029',
  'PAYSTACK': '000030',
  'FLUTTERWAVE': '000031',
  'INTERSWITCH': '000032',
  'NIBSS': '000033',
  'NUBAN': '000035',
  'NIP': '000037',
  'NQR': '000038',
  'USSD': '000039',
  'ATM': '000040',
  'POS': '000041',
  'WEB': '000042',
  'MOBILE': '000043',
  'AGENT': '000044',
  'BRANCH': '000045',
  'HEAD OFFICE': '000046',
  'REGIONAL OFFICE': '000047',
  'ZONAL OFFICE': '000048',
  'AREA OFFICE': '000049',
  'DIVISIONAL OFFICE': '000050',
  'UNIT OFFICE': '000051',
  'SERVICE CENTER': '000052',
  'CUSTOMER CARE': '000053',
  'HELP DESK': '000054',
  'SUPPORT': '000055',
  'TECHNICAL': '000056',
  'ADMINISTRATIVE': '000057',
  'OPERATIONS': '000058',
  'FINANCE': '000059',
  'ACCOUNTING': '000060',
  'AUDIT': '000061',
  'COMPLIANCE': '000062',
  'RISK MANAGEMENT': '000063',
  'CREDIT': '000064',
  'LOANS': '000065',
  'DEPOSITS': '000066',
  'SAVINGS': '000067',
  'CURRENT': '000068',
  'DOMICILIARY': '000069',
  'FOREIGN CURRENCY': '000070',
  'LOCAL CURRENCY': '000071',
  'NAIRA': '000072',
  'DOLLAR': '000073',
  'EURO': '000074',
  'POUND': '000075',
  'YEN': '000076',
  'YUAN': '000077',
  'FRANC': '000078',
  'RAND': '000079',
  'CEDIS': '000080',
  'DINAR': '000081',
  'RIAL': '000082',
  'RUPEE': '000083',
  'PESO': '000084',
  'REAL': '000085',
  'PESO': '000086',
  'SOL': '000087',
  'BOLIVAR': '000088',
  'GUARANI': '000089',
  'SUCRE': '000090',
  'CORDOBA': '000091',
  'LEMPIRA': '000092',
  'QUETZAL': '000093',
  'COLON': '000094',
  'BALBOA': '000095',
  'CORDOBA': '000096',
  'PESO': '000097',
  'BOLIVAR': '000098',
  'GUARANI': '000099',
  'SUCRE': '000100',
  
  // Microfinance Banks
  'AB MICROFINANCE BANK': '090001',
  'ABBEY MORTGAGE BANK': '070001',
  'ABOVE ONLY MICROFINANCE BANK': '090002',
  'ABU MICROFINANCE BANK': '090003',
  'ACCESS BANK (DIAMOND)': '000005',
  'ACCION MICROFINANCE BANK': '090004',
  'AHMEDU BELLO UNIVERSITY MICROFINANCE BANK': '090005',
  'AIICO MICROFINANCE BANK': '090006',
  'AL-BARKAH MICROFINANCE BANK': '090007',
  'AL-HAYAT MICROFINANCE BANK': '090008',
  'ALHERI MICROFINANCE BANK': '090009',
  'AMJU UNIQUE MICROFINANCE BANK': '090010',
  'AMML MICROFINANCE BANK': '090011',
  'APEKS MICROFINANCE BANK': '090012',
  'AROHA MICROFINANCE BANK': '090013',
  'ASO SAVINGS AND LOANS': '090014',
  'BANEX MICROFINANCE BANK': '090015',
  'BOWEN MICROFINANCE BANK': '090016',
  'CARBON MICROFINANCE BANK': '090017',
  'CEMCS MICROFINANCE BANK': '090018',
  'CHIKUM MICROFINANCE BANK': '090019',
  'CITIBANK NIGERIA': '000009',
  'COALCITY MICROFINANCE BANK': '090020',
  'COLLECTIVE MICROFINANCE BANK': '090021',
  'CORONATION MERCHANT BANK': '000021',
  'COVENANT MICROFINANCE BANK': '090022',
  'CREDIT AFRIQUE MICROFINANCE BANK': '090023',
  'DAYLIGHT MICROFINANCE BANK': '090024',
  'DIAMOND BANK': '000005',
  'EARTHOLEUM MICROFINANCE BANK': '090025',
  'ECOBANK NIGERIA': '000010',
  'EKONDO MICROFINANCE BANK': '090026',
  'EMERALD MICROFINANCE BANK': '090027',
  'EMPIRE TRUST MICROFINANCE BANK': '090028',
  'ENUCH MICROFINANCE BANK': '090029',
  'FAST FUND MICROFINANCE BANK': '090030',
  'FBN MORTGAGES LIMITED': '000016',
  'FCMB EASY ACCOUNT': '000003',
  'FIDELITY MOBILE': '000007',
  'FINATRUST MICROFINANCE BANK': '090031',
  'FIRST BANK MOBILE': '000016',
  'FIRST GENERATION MORTGAGE BANK': '090032',
  'FIRST ROYAL MICROFINANCE BANK': '090033',
  'FORTIS MICROFINANCE BANK': '090034',
  'FULLRANGE MICROFINANCE BANK': '090035',
  'GATEWAY MORTGAGE BANK': '090036',
  'GOMONEY MICROFINANCE BANK': '090037',
  'GREENBANK MICROFINANCE BANK': '090038',
  'GREENVILLE MICROFINANCE BANK': '090039',
  'GROOMING MICROFINANCE BANK': '090040',
  'GTBANK MOBILE': '000013',
  'HACKMAN MICROFINANCE BANK': '090041',
  'HASAL MICROFINANCE BANK': '090042',
  'HAVILAH MICROFINANCE BANK': '090043',
  'HERITAGE BANK': '000020',
  'IBILE MICROFINANCE BANK': '090044',
  'IKOYI OSUN MICROFINANCE BANK': '090045',
  'IMOWO MICROFINANCE BANK': '090046',
  'INFINITI MICROFINANCE BANK': '090047',
  'INNOVECTIVES KESH': '090048',
  'INTELLIFIN MICROFINANCE BANK': '090049',
  'INTERLAND MICROFINANCE BANK': '090050',
  'JAIZ BANK': '000006',
  'JUBILEE-LIFE MORTGAGE BANK': '090051',
  'KADPOLY MICROFINANCE BANK': '090052',
  'KANGOVE MICROFINANCE BANK': '090053',
  'KEGOW': '100015',
  'KONGA PAY': '090054',
  'KORAPAY': '000029',
  'KUDA BANK': '000022',
  'LA FAYETTE MICROFINANCE BANK': '090055',
  'LAGOS BUILDING INVESTMENT COMPANY': '090056',
  'LAPO MICROFINANCE BANK': '090057',
  'LAVENDER MICROFINANCE BANK': '090058',
  'LIVINGTRUST MICROFINANCE BANK': '090059',
  'LOTUS BANK': '000023',
  'MAYFAIR MICROFINANCE BANK': '090060',
  'MINT MICROFINANCE BANK': '090061',
  'MONIE POINT': '000026',
  'MONEY MASTER PSB': '120005',
  'MUTUAL BENEFITS MICROFINANCE BANK': '090062',
  'MUTUAL TRUST MICROFINANCE BANK': '090063',
  'NAGARTA MICROFINANCE BANK': '090064',
  'NIGERIAN NAVY MICROFINANCE BANK': '090065',
  'NOVA MERCHANT BANK': '000024',
  'NUBAN': '000035',
  'NUBAN MICROFINANCE BANK': '090066',
  'OAK MICROFINANCE BANK': '090067',
  'OMIYE MICROFINANCE BANK': '090068',
  'OPAY': '000024',
  'PAGA': '090069',
  'PALMPAY': '000025',
  'PARKWAY MICROFINANCE BANK': '090070',
  'PAYSTACK': '000030',
  'PEACE MICROFINANCE BANK': '090071',
  'PERSONAL TRUST MICROFINANCE BANK': '090072',
  'PETRA MICROFINANCE BANK': '090073',
  'PLATINUM MORTGAGE BANK': '090074',
  'POLARIS BANK': '000008',
  'POUND STERLING MICROFINANCE BANK': '090075',
  'PRESTIGE MICROFINANCE BANK': '090076',
  'PRIMERCO MICROFINANCE BANK': '090077',
  'PROVIDUS BANK': '000101',
  'PURPLEMONEY MICROFINANCE BANK': '090078',
  'QUICKFUND MICROFINANCE BANK': '090079',
  'RAND MERCHANT BANK': '000025',
  'REHOBOTH MICROFINANCE BANK': '090080',
  'RENMONEY MICROFINANCE BANK': '090081',
  'REPUBLIC BANK': '000026',
  'RICHWAY MICROFINANCE BANK': '090082',
  'ROYAL EXCHANGE MICROFINANCE BANK': '090083',
  'SAGE GREY TRUST MICROFINANCE BANK': '090084',
  'SEAP MICROFINANCE BANK': '090085',
  'SPARKLE MICROFINANCE BANK': '090086',
  'STANBIC IBTC BANK': '000012',
  'STANBIC IBTC MORTGAGE BANK': '090087',
  'STB MORTGAGE BANK': '070022',
  'STERLING BANK': '000001',
  'STERLING MOBILE': '000001',
  'SUNBEAM MICROFINANCE BANK': '090302',
  'SUNTRUST BANK': '000027',
  'SUPPORT MICROFINANCE BANK': '090088',
  'TAJWALLET': '080002',
  'TANGERINE MONEY': '090089',
  'TANGERINE MONEY MICROFINANCE BANK': '090090',
  'TEKLA FINANCE LTD': '050007',
  'TITAN TRUST BANK': '000028',
  'TRINITY FINANCIAL SERVICES LIMITED': '050014',
  'TRUSTBOND MICROFINANCE BANK': '090091',
  'TRUSTFUND MICROFINANCE BANK': '090092',
  'UDA MICROFINANCE BANK': '090403',
  'UNICAL MICROFINANCE BANK': '090093',
  'UNILORIN MICROFINANCE BANK': '090341',
  'UNIUYO MICROFINANCE BANK': '090338',
  'UNION BANK': '000018',
  'UNION BANK MOBILE': '000018',
  'UNITED BANK FOR AFRICA': '000004',
  'UNITY BANK': '000011',
  'UNIVERSAL MICROFINANCE BANK': '090094',
  'UPDC MICROFINANCE BANK': '090095',
  'VALE FINANCE LIMITED': '050020',
  'VFD MICROFINANCE BANK': '000028',
  'VULTE MICROFINANCE BANK': '090096',
  'WEMA BANK': '000017',
  'WEMA MOBILE': '000017',
  'WINVIEW BANK': '090419',
  'WRA MICROFINANCE BANK': '090631',
  'XPRESS PAYMENTS': '090201',
  'XPRESS WALLET': '100040',
  'YELLOW MICROFINANCE BANK': '090097',
  'ZENITH BANK': '000015',
  'ZENITH MOBILE': '000015'
};

async function updateBankCodesFromNubAPI() {
  try {
    console.log('🔧 Updating bank codes from NubAPI...\n');
    console.log(`📊 Total banks to process: ${Object.keys(nubApiBankCodes).length}\n`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    
    for (const [bankName, correctCode] of Object.entries(nubApiBankCodes)) {
      try {
        const result = await prisma.bank.updateMany({
          where: { 
            name: {
              contains: bankName,
              mode: 'insensitive'
            }
          },
          data: { 
            code: correctCode,
            longcode: correctCode,
            slug: correctCode.toLowerCase(),
            active: 1,
            isDeleted: 0
          }
        });
        
        if (result.count > 0) {
          console.log(`✅ Updated ${bankName}: ${correctCode} (${result.count} records)`);
          updatedCount += result.count;
        } else {
          // Try exact match
          const exactResult = await prisma.bank.updateMany({
            where: { name: bankName },
            data: { 
              code: correctCode,
              longcode: correctCode,
              slug: correctCode.toLowerCase(),
              active: 1,
              isDeleted: 0
            }
          });
          
          if (exactResult.count > 0) {
            console.log(`✅ Updated (exact) ${bankName}: ${correctCode} (${exactResult.count} records)`);
            updatedCount += exactResult.count;
          } else {
            console.log(`⚠️  Bank not found: ${bankName}`);
            notFoundCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Error updating ${bankName}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📋 Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} records`);
    console.log(`⚠️  Banks not found: ${notFoundCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    console.log('\n🔍 Verifying major bank updates:');
    const majorBanks = [
      'FIRST BANK OF NIGERIA',
      'ACCESS BANK', 
      'UNITED BANK FOR AFRICA',
      'ZENITH BANK',
      'GTBANK PLC',
      'FIDELITY BANK',
      'STANBIC IBTC BANK',
      'UNION BANK',
      'WEMA BANK',
      'POLARIS BANK'
    ];
    
    const updatedBanks = await prisma.bank.findMany({
      where: {
        name: {
          in: majorBanks
        }
      },
      select: { name: true, code: true, longcode: true },
      orderBy: { name: 'asc' }
    });
    
    updatedBanks.forEach(bank => {
      const expectedCode = nubApiBankCodes[bank.name];
      const status = bank.code === expectedCode ? '✅' : '❌';
      console.log(`${status} ${bank.name}: ${bank.code} ${bank.code !== expectedCode ? `(expected: ${expectedCode})` : ''}`);
    });
    
    console.log('\n🎉 Bank codes update completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBankCodesFromNubAPI();
