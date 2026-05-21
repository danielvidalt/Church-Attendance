export interface Country {
  code: string;
  nameEs: string;
  nameEn: string;
}

function flag(code: string): string {
  return [...code.toUpperCase()].map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

export const COUNTRIES: (Country & { flag: string })[] = [
  { code: 'AR', nameEs: 'Argentina',             nameEn: 'Argentina'            },
  { code: 'AU', nameEs: 'Australia',              nameEn: 'Australia'            },
  { code: 'BO', nameEs: 'Bolivia',                nameEn: 'Bolivia'              },
  { code: 'BR', nameEs: 'Brasil',                 nameEn: 'Brazil'               },
  { code: 'CL', nameEs: 'Chile',                  nameEn: 'Chile'                },
  { code: 'CO', nameEs: 'Colombia',               nameEn: 'Colombia'             },
  { code: 'CR', nameEs: 'Costa Rica',             nameEn: 'Costa Rica'           },
  { code: 'CU', nameEs: 'Cuba',                   nameEn: 'Cuba'                 },
  { code: 'DO', nameEs: 'República Dominicana',   nameEn: 'Dominican Republic'   },
  { code: 'EC', nameEs: 'Ecuador',                nameEn: 'Ecuador'              },
  { code: 'SV', nameEs: 'El Salvador',            nameEn: 'El Salvador'          },
  { code: 'ES', nameEs: 'España',                 nameEn: 'Spain'                },
  { code: 'US', nameEs: 'Estados Unidos',         nameEn: 'United States'        },
  { code: 'PH', nameEs: 'Filipinas',              nameEn: 'Philippines'          },
  { code: 'GT', nameEs: 'Guatemala',              nameEn: 'Guatemala'            },
  { code: 'HN', nameEs: 'Honduras',              nameEn: 'Honduras'             },
  { code: 'MX', nameEs: 'México',                 nameEn: 'Mexico'               },
  { code: 'NI', nameEs: 'Nicaragua',              nameEn: 'Nicaragua'            },
  { code: 'PA', nameEs: 'Panamá',                 nameEn: 'Panama'               },
  { code: 'PY', nameEs: 'Paraguay',               nameEn: 'Paraguay'             },
  { code: 'PE', nameEs: 'Perú',                   nameEn: 'Peru'                 },
  { code: 'PL', nameEs: 'Polonia',                nameEn: 'Poland'               },
  { code: 'PT', nameEs: 'Portugal',               nameEn: 'Portugal'             },
  { code: 'PR', nameEs: 'Puerto Rico',            nameEn: 'Puerto Rico'          },
  { code: 'GB', nameEs: 'Reino Unido',            nameEn: 'United Kingdom'       },
  { code: 'UY', nameEs: 'Uruguay',                nameEn: 'Uruguay'              },
  { code: 'VE', nameEs: 'Venezuela',              nameEn: 'Venezuela'            },
].map(c => ({ ...c, flag: flag(c.code) }));

export function getCountryLabel(code: string, lang: 'es' | 'en'): string {
  const c = COUNTRIES.find(c => c.code === code);
  if (!c) return code;
  return `${c.flag} ${lang === 'es' ? c.nameEs : c.nameEn}`;
}
