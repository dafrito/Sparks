BUILDDIR := build
DISTDIR := $(BUILDDIR)/dist
SRCDIR := js

DEPENDENCIES := dependency.list
DISTRIBUTABLES := $(addprefix sparks, .js .js.gz .js.zip .js.bz2)

all: dist
.PHONY: all

dist: $(addprefix $(DISTDIR)/, $(DISTRIBUTABLES)) | $(DISTDIR)

mochikit: $(BUILDDIR)/mochikit
.PHONY: mochikit

$(BUILDDIR)/mochikit: | $(BUILDDIR)
	git clone git://github.com/mochi/mochikit.git
	
$(DISTDIR)/sparks.js.bz2: $(DISTDIR)/sparks.js
	bzip2 -c $<  >$@

$(DISTDIR)/sparks.js.gz: $(DISTDIR)/sparks.js
	gzip -c $<  >$@

$(DISTDIR)/sparks.js.zip: $(DISTDIR)/sparks.js
	zip $@ $<

$(BUILDDIR)/sparks-unpacked.js: $(DEPENDENCIES) | $(BUILDDIR)
	sed -e 's#^#$(SRCDIR)/#' ./$(DEPENDENCIES) | \
	xargs cat >$(BUILDDIR)/sparks-unpacked.js

$(DISTDIR)/sparks.js: $(BUILDDIR)/sparks-unpacked.js | $(DISTDIR)
	perl -n -n0777 -e 'use JavaScript::Minifier::XS qw(minify); print minify($$_);' \
		$(BUILDDIR)/sparks-unpacked.js >$(DISTDIR)/sparks.js

$(DISTDIR): | $(BUILDDIR)
	mkdir $(DISTDIR)

$(BUILDDIR):
	mkdir $(BUILDDIR)

clean:
	rm -rf $(BUILDDIR)
	rm -rf $(DISTDIR)
.PHONY: clean
