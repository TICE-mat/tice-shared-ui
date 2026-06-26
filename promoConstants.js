export const DM_ALIGNMENT = {
  'Pedro Ortega':   [13011, 12534, 11630, 12052, 13267, 11528, 12605],
  'Carlos Tenorio': [12245, 11612, 12079, 12310, 12485, 11808, 11942],
  'Kyle Lusher':    [12050, 12102, 11578, 8495, 12042, 11579],
  'James Frazine':  [2509, 11677, 12604, 7318, 7200, 11895, 12055],
  'Shawn Haman':    [11844, 12051, 12209, 12455, 12546, 13660, 13264],
  'Jay Tarantino':  [13244, 12545, 11525, 11526, 13882, 8534],
  'Lavasha Rouse':  [11629, 11894, 11943, 11576, 11527, 12370],
}

export const DM_MAP = {}
for (const [dm, stores] of Object.entries(DM_ALIGNMENT)) {
  for (const sn of stores) DM_MAP[sn] = dm
}
