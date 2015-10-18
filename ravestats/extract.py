import calendar
import numpy as np
from math import radians as rad
import ephem


f = open('/Users/gal/research/rave/dr4/ravedr4.dat')
d = f.readlines()
f.close()
rave = [(i[482:490].strip(), float(i[52:64]), float(i[65:77]), float(i[78:87]),
        float(i[88:97]), float(i[98:106]), float(i[512:519]),
        float(i[528:533]), float(i[546:551]), float(i[558:564]),
        float(i[735:741]), float(i[670:676]), float(i[683:689]),
        float(i[696:702]), float(i[853:862])) for i in d]

robsd = np.array([i[0] for i in rave])
rdata = np.array([i[1:] for i in rave])

m = ephem.Moon()

# header
print 'Date,Nobs,RA,DEC,Glon,Glat,HRV,Teff,logg,met,SNR,Imag,Jmag,Hmag,Kmag,J-K,dist,moon'
fmt = '%s,%d,%f,%f,%f,%f,%f,%f,%f,%f,%f,%f,%f,%f,%f,%f,%f,%f'

for year in range(2003, 2013):
    for month in range(1, 13):
        for day in range(1, calendar.monthrange(year, month)[1] + 1):
            obsdate = '%d%02d%02d' % (year, month, day)
            obsdatef = '%d-%02d-%02d' % (year, month, day)
            sel = robsd == obsdate

            rds = rdata[sel].T
            Nobs = len(rds[0])

            m.compute(obsdatef)

            if Nobs:
                ra = np.mean(rds[0])
                dec = np.mean(rds[1])
                glon = np.mean(rds[2])
                glat = np.mean(rds[3])
                hrv = np.mean(rds[4])
                teff = np.median(rds[5])
                logg = np.median(rds[6])
                met = np.median(rds[7])
                snr = np.median(rds[8])
                imag = np.median(rds[9])
                jmag = np.mean(rds[10])
                hmag = np.mean(rds[11])
                kmag = np.mean(rds[12])
                jmk = np.mean(rds[10] - rds[12])
                dist = np.mean(rds[13])
                moonphase = m.phase * 0.01

                print fmt % (obsdatef, Nobs, ra, dec, glon, glat, hrv, teff,
                             logg, met, snr, imag, jmag, hmag, kmag, jmk,
                             dist, moonphase)
