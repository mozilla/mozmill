#
# iniparser Makefile
#
UNAME := $(shell uname -s)

# Compiler settings
CC      = gcc
# Ar settings to build the library
AR	    = ar
ARFLAGS = rcv
SHLD = ${CC} ${CFLAGS}
ifeq (($UNAME), Linux)
    CFLAGS  = -O2 -fPIC -Wall -ansi -pedantic
    LDSHFLAGS = -shared -Wl,-Bsymbolic  -Wl,-rpath -Wl,/usr/lib -Wl,-rpath,/usr/lib
endif

ifeq (($UNAME), Darwin)
    CFLAGS  = -v -arch i386 -fPIC -Wall -ansi -pedantic -lcxcore
    LDSHFLAGS = -v -dylib
endif

LDFLAGS = -Wl,-rpath -Wl,/usr/lib -Wl,-rpath,/usr/lib

# Set RANLIB to ranlib on systems that require it (Sun OS < 4, Mac OSX)
# RANLIB  = ranlib
RANLIB = true

RM      = rm -f


# Implicit rules

SUFFIXES = .o .c .h .a .so .sl

COMPILE.c=$(CC) $(CFLAGS) -c
.c.o:
	@(echo "compiling $< ...")
	@($(COMPILE.c) -o $@ $<)


SRCS = iniparser.c \
	   dictionary.c

OBJS = $(SRCS:.c=.o)


default:	libiniparser.a libiniparser.so

libiniparser.a:	$(OBJS)
	@($(AR) $(ARFLAGS) libiniparser.a $(OBJS))
	@($(RANLIB) libiniparser.a)

libiniparser.so:	$(OBJS)
	@$(SHLD) $(LDSHFLAGS) -o $@.0 $(OBJS) $(LDFLAGS)

clean:
	$(RM) $(OBJS)

veryclean:
	$(RM) $(OBJS) libiniparser.a libiniparser.so*
	rm -rf ./html ; mkdir html
	cd test ; $(MAKE) veryclean

docs:
	@(cd doc ; $(MAKE))
	
check:
	@(cd test ; $(MAKE))
