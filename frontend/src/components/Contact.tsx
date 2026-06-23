import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";

function Contact() {
  return (
    <section id="contact" className="border-t border-hairline py-16 md:py-section">
      <div className="mx-auto max-w-content px-5 md:px-8">
        <Card padding="lg">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <span className="text-caption-upper text-brand">Contact</span>
              <h3 className="mt-3 text-display-sm text-3xl font-bold text-on-dark">
                Get in touch
              </h3>
              <p className="mt-3 text-prose">
                Have questions or need support? Reach out to us anytime.
              </p>
            </div>

            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div>
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  type="text"
                  placeholder="Your name"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="contact-message">Message</Label>
                <textarea
                  id="contact-message"
                  placeholder="Your message"
                  rows={4}
                  className="mt-2 flex w-full rounded-md border border-hairline bg-surface-card px-3.5 py-2 text-sm text-on-dark placeholder:text-muted-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                />
              </div>
              <Button type="submit" className="w-fit">
                Send message
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </section>
  );
}

export default Contact;
