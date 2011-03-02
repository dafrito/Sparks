BUILDDIR := build
SRCDIR := js
DEPENDENCIES := dependency.list

all: $(BUILDDIR)/sparks.js
.PHONY: all

clean:
	rm -rf $(BUILDDIR)

$(BUILDDIR)/sparks-unpacked.js: $(DEPENDENCIES) | $(BUILDDIR)
	sed -e 's#^#$(SRCDIR)/#' ./$(DEPENDENCIES) | \
	xargs cat >$(BUILDDIR)/sparks-unpacked.js

$(BUILDDIR)/sparks.js: $(BUILDDIR)/sparks-unpacked.js
	perl -n -n0777 -e 'use JavaScript::Minifier::XS qw(minify); print minify($$_);' \
		$(BUILDDIR)/sparks-unpacked.js >$(BUILDDIR)/sparks.js

$(BUILDDIR):
	mkdir $(BUILDDIR)
