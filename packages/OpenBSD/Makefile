#
COMMENT =	web interface to explore Netflow/IPFIX data

V = 0.6.2
DISTNAME =	nfexplorer-${V}
REVISION = 	3

DYGRAPHS = 	dygraphs-${DYV}
DYV = 		2.2.1

DIST_TUPLE +=	github mgraves00 nfexplorer v${V} .

DISTFILES.dygraphs += 		${DYGRAPHS}.tgz
SITES.dygraphs += 		https://github.com/danvk/dygraphs/releases/download/v${DYV}/
# there is no SITE_GITHUB like other distribution sites
#SITES.dygraphs += 		${SITE_GITHUB:=danvk/dygraphs}

CATEGORIES =	www
HOMEPAGE =	https://github.com/mgraves00/nfexplorer
MAINTAINER =	Michael Graves

# MIT-nfexplorer
# MIT-dygraphs
PERMIT_PACKAGE =	Yes
PERMIT_DISTFILES =	Yes

CONFIGURE_STYLE = none
NO_BUILD = Yes
NO_TEST = Yes
PKG_ARCH = *

# Dependencies
RUN_DEPENDS =		net/nfdump

PREFIX = 		${VARBASE}/www
INSTDIR = 		${PREFIX}/nfexplorer
SUBST_VARS =		INSTDIR VARBASE
DYWRKSRC = 		${WRKDIR}/package/dist

do-install:
	${INSTALL_SCRIPT_DIR} ${INSTDIR}/
	${INSTALL_SCRIPT} ${WRKSRC}/nfquery.cgi ${INSTDIR}/
	${INSTALL_DATA} ${WRKSRC}/index.html ${INSTDIR}/
	${INSTALL_DATA} ${WRKSRC}/addr.js ${INSTDIR}/
	${INSTALL_DATA} ${WRKSRC}/flow_sort.js ${INSTDIR}/
	${INSTALL_DATA} ${WRKSRC}/flows.js ${INSTDIR}/
	${INSTALL_DATA} ${WRKSRC}/graphs.js ${INSTDIR}/
	${INSTALL_DATA} ${WRKSRC}/ui.js ${INSTDIR}/
	${INSTALL_DATA_DIR} ${PREFIX}/etc
	${INSTALL_DATA} ${WRKSRC}/nfquery.env ${PREFIX}/etc/nfquery.env.example
	# dygraphs
	${INSTALL_DATA} ${DYWRKSRC}/dygraph.js{,.map} ${INSTDIR}/
	${INSTALL_DATA} ${DYWRKSRC}/dygraph.css ${INSTDIR}/
	${INSTALL_DATA} ${DYWRKSRC}/dygraph.min.js{,.map} ${INSTDIR}/
	${INSTALL_DATA} ${DYWRKSRC}/dygraph.min.css{,.map} ${INSTDIR}/

.include <bsd.port.mk>
